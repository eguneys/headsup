import { ticks } from './shared'

import { mapArray, createMemo, on, createSignal, createEffect } from 'soli2d-js'
import { read, write, owrite } from './play'

import { TweenVal } from './lerps'

import { WhoHasAction, aww_action_type, aww_ontop, aww_who, Check, Call, Fold, Raise, AllIn, BigBlind, SmallBlind } from 'cardstwo'


export type Chips = Array<number>

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

  _pov: Signal<HeadsUpRoundPov>

  _fold_after: Signal<Timestamp>

  m_stacks: Memo<[Chips, Chips]>

  m_allow_check: Memo<ActionWithWho>
  m_allow_call: Memo<ActionWithWho>
  m_allow_fold: Memo<ActionWithWho>
  m_allow_raise: Memo<ActionWithWho>
  m_allow_allin: Memo<ActionWithWho>

  m_actions: Memo<Array<CurrentAction>>

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
    this._on_action = createSignal()
    this._fold_after = createSignal(fold_after)
    this._pov = createSignal(pov)

    this.m_current_who = createMemo(() => read(this._pov).current_who)

    this.m_me = createMemo(() => read(this._pov).who)
    this.m_who = createMemo(() => read(this._pov).who)

    this.m_stacks = createMemo(() => read(this._pov)
                               .left_stacks
                               .map((_, i) => 
                                    make_stack(_,
                                               this.m_current_who() === i+1 ? read(this._fold_after)
                                               : undefined,
                                               ...who_stack_pos(this.m_me(), i+1))))

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
  }


  click_action = (aww: ActionWithWho) => {
    owrite(this._on_action, aww)
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
