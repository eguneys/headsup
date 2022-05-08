import { ticks } from './shared'

import { untrack, mapArray, createMemo, on, createSignal, createEffect } from 'soli2d-js'
import { read, write, owrite } from './play'

import { TweenVal, LoopVal, PingPongVal } from './lerps'

import { whos, WhoHasAction, aww_action_type, who_next, aww_ontop, aww_who, Check, Call, Fold, Raise, AllIn, BigBlind, SmallBlind } from 'cardstwo'
import { card_rank, card_suit } from 'cardstwo'


export type Chips = Array<number>
export type Letters = Array<number>

const digit_frames = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'P', ',']

export function format_chips(chips: number) {
  let res = String(chips).split('').flatMap((_, i, arr) => {
    if ((arr.length - i) % 3 === 0 && i !== 0) {
      return [',', _]
    }
    return [_]
  })
  return res.map(_ => digit_frames.indexOf(_))
}

const letter_frames = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!','0','1','2','3','4','5','6','7','8','9', 'P', ',']

export function format_letters(str: string) {
  return str.split('').map(_ => letter_frames.indexOf(_))
}

const hand_values = ['', 'high card', 'one pair']

export function who_diff(me: WhoHasAction, who: WhoHasAction) {
  return ((me - who) + 2) % 2
}

const who_stack_poss = [[200, 166], [200, 20]]

export function who_stack_pos(me: WhoHasAction, who: WhoHasAction) {
  return who_stack_poss[who_diff(me, who)]
}

const who_action_poss = [[200, 140], [200, 50]]
export function who_action_pos(me: WhoHasAction, who: WhoHasAction) {
  return who_action_poss[who_diff(me, who)]
}

const aww_action_type_frames = [0, 1, 2, 3, 4, 5, 6]

export class HeadsUp {

  _on_action: Signal<ActionWithWho | undefined>
  _on_showdown: Signal<undefined>

  _pov: Signal<HeadsUpRoundPov>

  _fold_after: Signal<Timestamp>


  _status: Signal<Letters>

  m_stacks: Memo<[Chips, Chips]>

  m_allow_check: Memo<ActionWithWho>
  m_allow_call: Memo<ActionWithWho>
  m_allow_fold: Memo<ActionWithWho>
  m_allow_raise: Memo<ActionWithWho>
  m_allow_allin: Memo<ActionWithWho>

  m_actions: Memo<Array<CurrentAction>>

  set status(str: string) {
    owrite(this._status, str)
  }

  get on_showdown() {
    return read(this._on_showdown)
  }

  get on_action() {
    return read(this._on_action)
  }

  set pov(pov: HeadsUpRoundPov) {
    owrite(this._pov, pov)
  }

  set fold_after(fold_after: Timestamp) {
    owrite(this._fold_after, fold_after)
  }

  get stacks() {
    return this._stacks()
  }

  constructor(pov: HeadsUpRoundPov, fold_after: Timestamp) {
    this._status = createSignal('')
    this._on_showdown = createSignal(undefined, { equals: false })
    this._on_action = createSignal(undefined, { equals: false })
    this._fold_after = createSignal(fold_after)
    this._pov = createSignal(pov)

    this.m_current_who = createMemo(() => read(this._pov).current_who)

    this.m_me = createMemo(() => read(this._pov).who)
    this.m_who = createMemo(() => read(this._pov).who)
    this.who2 = () => who_next(this.m_who())

    let my_actions = createMemo(() => {
      return read(this._pov).allowed_actions.filter(_ => aww_who(_) === this.m_who())
    })


    this.m_allow_allin = createMemo(() =>
      my_actions().find(_ =>
        aww_action_type(_) === AllIn)
    )

    this.m_allow_check = createMemo(() =>
      my_actions().find(_ =>
        aww_action_type(_) === Check)
    )

    this.m_allow_call = createMemo(() =>
      my_actions().find(_ =>
        aww_action_type(_) === Call)
    )

    this.m_allow_fold = createMemo(() =>
      my_actions().find(_ =>
        aww_action_type(_) === Fold)
    )

    this.m_allow_raise = createMemo(() =>
      my_actions().find(_ =>
         aww_action_type(_) === Raise))

    this.current_actions = createMemo(() =>
      read(this._pov).current_action.actions
    )

    this.last_current_actions = createMemo(() => {
      let actions = this.current_actions()

      let res = new Map<WhoHasAction, ActionWithWho>()

      actions.forEach(action =>
        res.set(aww_who(action), action))

      return [...res.values()]
    })

    this.m_actions = createMemo(mapArray(
      this.last_current_actions,
      _ => make_current_action(_, ...who_action_pos(this.m_me(), aww_who(_)))))


    let m_pot = createMemo(() => read(this._pov).pot)

    this.m_pot = () => format_chips(m_pot())

    this.m_hand = createMemo(mapArray(
      () => read(this._pov).middle.hand,
        (_, i) => make_card(_, 131+i()*32, 140)))


    this.m_hand2 = createMemo(mapArray(
      () => read(this._pov).middle.hand2,
        (_, i) => make_card(_, 131, i()*32, 60)))

    this.m_flop = createMemo(mapArray(
      () => read(this._pov).middle.flop,
        (_, i) => make_card(_, 10 + i() * 33, 76)))


    let m_turn_array = createMemo(mapArray(
      () => {
        let res = read(this._pov).middle.turn
        if (res) {
          return [res]
        }
      },
        (_, i) => make_card(_, 10 + 3 * 33 + 3, 76)))

    this.m_turn = () => m_turn_array()[0]


    let m_river_array = createMemo(mapArray(
      () => {
        let res = read(this._pov).middle.river
        if (res) {
          return [res]
        }
      },
        (_, i) => make_card(_, 10 + 4 * 33 + 3, 76)))

    this.m_river = () => m_river_array()[0]

    this.showdown = createMemo(() => read(this._pov).showdown)

    let fold_after_not_on_showdown = () => {
      if (!this.showdown()) {
        return read(this._fold_after)
      }
    }

    let m_showdown = createMemo(() => read(this._pov).showdown)
    let m_showdown_middle = createMemo(() => m_showdown()?.middle)

    let m_showdown_flop = createMemo(() => m_showdown_middle()?.flop),
      m_showdown_turn = createMemo(() => m_showdown_middle()?.turn),
      m_showdown_river = createMemo(() => m_showdown_middle()?.river),
      m_showdown_hands = createMemo(() => m_showdown_middle()?.hands)
    let m_showdown_hand2 = () => m_showdown_hands()?.get(this.who2())

    let m_show_hand2 = create_delayed(m_showdown_hand2, () => 
                                      m_showdown() ? ticks.seconds : undefined),
      m_show_flop = create_delayed(m_showdown_flop, () => 
                                   m_show_hand2() ? (!!this.m_flop().length > 0 ? 0 : ticks.seconds) : undefined),
      m_show_turn = create_delayed(m_showdown_turn, () =>
                                   m_show_flop() ? (!!this.m_turn() ? 0 : ticks.seconds) : undefined),
      m_show_river = create_delayed(m_showdown_river, () =>
                                   m_show_turn() ? (!!this.m_river() ? 0 : ticks.seconds) : undefined)


      let m_showdown_end = create_delayed(m_show_river, () => ticks.seconds)
      

      this.m_show_hand2 = createMemo(() =>
        m_show_hand2()?.map((_, i) =>
          make_card(_, 131 + i * 32, 19)
        ))
      
      this.m_show_flop = createMemo(() =>
      m_show_flop()?.map((_, i) =>
                         make_card(_, 10 + i * 33, 76, this.m_flop().length === 0)))

      this.m_show_turn = createMemo(() => {
        let _ = m_show_turn()
        if (_) {
          return make_card(_, 10 + 3 * 33 + 3, 76, !this.m_turn())
        }
      })
      this.m_show_river = createMemo(() => {
        let _ = m_show_river()
        if (_) {
          return make_card(_, 10 + 4 * 33 + 3, 76, this.m_river())
        }
      })

      let m_show_middle_all = createMemo(on(this.m_show_river, () => {
        let river = this.m_show_river()
        if (river) {
          return [...this.m_show_flop(), this.m_show_turn(), river]
        }
      }))

    let m_winner_hands = createMemo(() => {
      return m_showdown()?.winner_hands
    })

    let m_hands_by_who = createMemo(() => 
             new Map(whos.map(who =>
                              [who, [this.m_hand(),
                                this.m_show_hand2()][who_diff(this.m_me(), who)]])))

    createEffect(on(m_show_middle_all, () => {
      let hands = m_winner_hands()?.[0]
      if (hands) {
        let [who, [hv, hand]] = hands
        this.status = hand_values[hv]
      } else {
        this.status = undefined
      }
    }))

    createEffect(on(m_show_middle_all, () => {
      let middle = m_show_middle_all()
      if (middle) {
        m_winner_hands()?.forEach(([who, [hv, hand]]) => {
          let m_hands = m_hands_by_who().get(who)!
          let _hand = hand.slice(0, 5);
          [...middle, ...m_hands].forEach(m => {
            if (_hand.includes(m.card)) {
              _hand.splice(_hand.indexOf(m.card), 1)
              m.elevate()
            }
          })
        })
      }
    }))

    createEffect(() => {
      m_showdown_end()

      owrite(this._on_showdown, undefined)
    })

    let m_left_stacks = createMemo(() => read(this._pov)
                                 .left_stacks)


    let m_left_stacks_delayed = create_delayed(m_left_stacks, () =>

                                               m_showdown() ? 
                                                 (m_showdown_middle() ? 
                                                  (m_show_river() ? ticks.seconds : ticks.seconds * 30) :
                                                  ticks.seconds) :
                                                  ticks.thirds)






    this.m_stacks = createMemo(_ => m_left_stacks_delayed()
          .map((_, i) => 
               make_stack(_,
                          this.m_current_who() === i+1 ? fold_after_not_on_showdown()
                            : undefined,
                            ...who_stack_pos(this.m_me(), i+1))))



    this.m_status = createMemo(() => {
      let res = read(this._status)
      if (res) {
        return make_status(res)
      }
    })
  }


  click_action = (aww: ActionWithWho) => {
    owrite(this._on_action, aww)
  }
}

const make_status = (str: string) => {
  let _x = new LoopVal(0, 1, ticks.seconds)

  let _x2 = new PingPongVal(0, 1, ticks.seconds, TweenVal.quad_in_out)

  let _x3 = new TweenVal(0, 1, ticks.half)

  return {
    get x3() { return _x3.value },
    get x2() { return _x2.value },
    get x() { return _x.value },
    letters: format_letters(str)
  }
}

const make_card = (card: OCard, x: number, y: number, reveal: boolean = true) => {

  let _y = new TweenVal(y, y, ticks.seconds, TweenVal.quad_in_out)
  let _reveal = new TweenVal(0, 1, ticks.half)

  let reveal_frame = () => reveal ? _reveal.i : 1

  let rank = () => card_rank(card)
  let suit = () => card_suit(card)

  let elevate = () => {
    _y.new_b(y - 4)
  }

  return {
    x,
    get y() { return _y.value },
    card,
    reveal_frame,
    elevate,
    rank,
    suit
  }
}

const make_current_action = (aww: ActionWithWho, x: number, y: number) => {
  let amount = format_chips(aww_ontop(aww))
  let frame = aww_action_type_frames[aww_action_type(aww)-1]

  return {
    x,
    y,
    amount,
    frame
  }
}

const make_stack = (chips: number, fold_after: Timestamp | undefined, x: number, y: number) => {

  let _time = fold_after && new TweenVal(Date.now(), fold_after, (fold_after - Date.now()))

  let ratio = fold_after && (fold_after - Date.now()) / 35000

  let i_width = createMemo(() => {
    if (_time) {
      return _time.i + (1- ratio)
    }
  })

  let turn_frame = createMemo(() => {
    if (_time) {
      let left = fold_after - _time.value
      if (left < 8000) {
        let dur = ticks.half + ticks.thirds
        return (Math.floor((left % dur) / dur * 2) === 1 ? 0 : 1)
      }
      return 1
    } else {
      return 0
    }
  })

  return {
    turn_frame,
    i_width,
    x,
    y,
    chips: format_chips(chips)
  }
}


export function create_delayed<T>(accessor: () => T | undefined, delay: () => number) {

  const _delayed = createSignal(accessor())

  let i_timeout

  createEffect(() => {
    accessor()
    let res = delay()

    clearTimeout(i_timeout)
    if (res !== undefined) {
      i_timeout = setTimeout(() => {
        owrite(_delayed, accessor())
      }, res)
    } else {
      owrite(_delayed, undefined)
    }
  })

  return () => read(_delayed)
}
