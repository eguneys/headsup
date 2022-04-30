import { ticks } from './shared'
import { createRoot, untrack, createMemo, onCleanup, on, batch, createSignal, createEffect } from 'soli2d-js'
import { Vec2 } from 'soli2d-js/web'
import { vec_transform_inverse_matrix } from './play'
import { read, write, owrite } from './play'
import { useApp } from './app'

import { HasPosition, LerpVal, LoopVal, TweenVal, PingPongVal } from './lerps'

import { Anim } from './anim'

import { same } from './util'
import { HasPositionCard } from './gsolitaire'

import { WhoHasAction, aww_ontop, aww_action_type, aww_who, Check, Call, Fold, Raise, AllIn, BigBlind, SmallBlind } from 'cardstwo'

const who_action_start_poss = [[200, 140], [200, 50]]
const who_stack_poss = [[200, 166], [200, 20]]

const aww_action_type_frames = [0, 1, 2, 3, 4, 5, 6]

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

export class HeadsUp {
  
  middle: Middle
  allowed_actions: AllowedActions


  who_diff(me: WhoHasAction, who: WhoHasAction) {
    return ((me - who) + 2) % 2
  }

  who_action_start_pos(who: WhoHasAction) {
    return who_action_start_poss[this.who_diff(this.me, who)]
  }

  who_stack_pos(who: WhoHasAction) {
    return who_stack_poss[this.who_diff(this.me, who)]
  }

  get back() {
    return this.anim.back
  }

  get me() {
    return this.who
  }

  get who() {
    return this.back.who
  }

  get pot() {
    return this.back.pot
  }
  
  constructor(readonly anim: Anim) {
    let { back } = this
    let hand = back.middle.hand.map(_ => 
                                    new HasPositionCard(0, 0, _))
    let hand2 = [1, 2].map(_ =>
                           new HasPositionCard(0, 0))

    this.middle = new Middle(this, hand, hand2)


    let allowed_actions = back.allowed_actions
    .filter(_ => aww_who(_) === this.who)

    let check = allowed_actions.find(_ => aww_action_type(_) === Check),
      call = allowed_actions.find(_ => aww_action_type(_) === Call),
      fold = allowed_actions.find(_ => aww_action_type(_) === Fold),
    raise = allowed_actions.find(_ => aww_action_type(_) === Raise),
    allin = allowed_actions.find(_ => aww_action_type(_) === AllIn)
    this.allowed_actions = new AllowedActions(
      this, 
      new AllowedAction(this, check), 
      new AllowedAction(this, call), 
      new AllowedAction(this, fold), 
      new AllowedAction(this, allin), 
      new AllowedAction(this, raise))


    let actions = back.current_action.actions
    .map(aww => 
         new ActionHasPos(this, aww))
    this.current_action = new CurrentAction(
      this,
      actions
    )

    this.pot_chips = new Chips(this, this.pot)



    this.stacks = back.left_stacks.map((stack, i) =>
      new Stack(this, Date.now() - 6000, stack, ...this.who_stack_pos(i+1)))

  }

  a_diff(back0: HeadsUpRoundPov) {

    let { back } = this.anim

    let allowed_actions = back.allowed_actions
    .filter(_ => aww_who(_) === this.who)

    let check = allowed_actions.find(_ => aww_action_type(_) === Check),
      call = allowed_actions.find(_ => aww_action_type(_) === Call),
      fold = allowed_actions.find(_ => aww_action_type(_) === Fold),
      raise = allowed_actions.find(_ => aww_action_type(_) > Raise),
      allin = allowed_actions.find(_ => aww_action_type(_) === AllIn)


    this.allowed_actions.check.allowed = check
    this.allowed_actions.call.allowed = call
    this.allowed_actions.fold.allowed = fold
    this.allowed_actions.raise.allowed = raise
    this.allowed_actions.allin.allowed = allin

    let actions0 = read(this.current_action.actions)

    let actions = back.current_action.actions
    .map((aww, i) =>
           new ActionHasPos(this, aww)).slice(-2)


           actions[0] = actions0[1]

    owrite(this.current_action.actions, actions)

    back.left_stacks.map((stack, i) =>
                        this.stacks[i].stack = stack)


  }

  action(aww: ActionWithWho) {
    this.anim.g_action(aww)
  }
}

class Stack extends HasPosition {


  set stack(stack: number) {
    this.chips.chips = stack
  }

  get turn_frame() {
    return this.left ? (this.left < 5000 ? Math.floor(this.left / ticks.half) % 2 : 0) : 1
  }


  get i_width() {
    return 1 * this.initial_ratio + (1 - this.initial_ratio) * this.i_left?.i
  }

  get left() {
    return this.i_left?.value
  }

  chips: Chips

  i_left?: TweenVal
  initial_ratio: number

  constructor(readonly headsup: HeadsUp, start?: number, stack: number, x: number, y: number) {

    super(x, y)

    this.chips = new Chips(headsup, stack)

    this.initial_ratio = (Date.now() - start) / 30000

    if (start) {
      this.i_left = new TweenVal((start + 30000) - Date.now(), 0, ticks.seconds * ((start + 30000 - Date.now())/1000))
    }
  }
}

class Chips {

  digits: Signal<Array<Digit>>

  _i_val: TweenVal

  set chips(chips: number) {
    this._i_val.new_b(chips)
  }

  constructor(readonly headsup: HeadsUp, chips:number) {

    this._i_val = new TweenVal(chips, chips, ticks.thirds, TweenVal.quad_in_out)

    this.digits = createSignal(format_chips(chips))

    createEffect(() => {
      owrite(this.digits, format_chips(Math.floor(this._i_val.value)))
    })
  }
}

class ActionHasPos extends HasPosition {


  get frame() {
    return aww_action_type_frames[this.type - 1]
  }

  get type() {
    let res = aww_action_type(this.aww)
    if (res > Raise) {
      return Raise
    }
    return res
  }

  amount: Chips

  constructor(headsup: HeadsUp, readonly aww: ActionWithWho) {
    super(...headsup.who_action_start_pos(aww_who(aww)))

    this.amount = new Chips(headsup, aww_ontop(aww))
  }

}

class CurrentAction {

  actions: Signal<Array<ActionHasPos>>

  constructor(readonly headsup: HeadsUp,
              actions: Array<ActionHasPos>) {
    this.actions = createSignal(actions)
  }

}

class AllowedAction extends HasPosition {


  get allowed() {
    return read(this._allowed)
  }

  set allowed(aww: ActionWithWho) {
    owrite(this._allowed, aww)
  }

  _allowed: Signal<ActionWithWho | undefined>
  constructor(readonly headsup: HeadsUp,
              readonly aww?: ActionWithWho) {
    super(0, 0)

    this._allowed = createSignal(aww)

  }

  on_click = () => {
    this.headsup.action(read(this._allowed))
  }
}

class AllowedActions {


  constructor(readonly headsup: Headsup,
              readonly check: AllowedAction,
              readonly call: AllowedAction,
              readonly fold: AllowedAction,
              readonly allin: AllowedAction,
              readonly raise: AllowedAction) { }
}


class Middle {

  hand2: Signal<[HasPositionCard, HasPositionCard]>
  hand: Signal<[HasPositionCard, HasPositionCard]>
  flop: Signal<[HasPositionCard, HasPositionCard, HasPositionCard] | undefined>
  turn: Signal<HasPositionCard | undefined>
  river: Signal<HasPositionCard | undefined>

  constructor(readonly headsup: Headsup,
              hand: [HasPositionCard, HasPositionCard],
              hand2: [HasPositionCard, HasPositionCard],
              flop?: [HasPositionCard, HasPositionCard, HasPositionCard],
              turn?: HasPositionCard,
              river?: HasPositionCard) {
                this.hand = createSignal(hand)
                this.hand2 = createSignal(hand2)
                this.flop = createSignal(flop)
                this.turn = createSignal(turn)
                this.river = createSignal(river)


                createEffect(() => {
                  let flop = read(this.flop),
                    turn = read(this.turn),
                    river = read(this.river)

                  batch(() => {

                    hand2.forEach((hand, i) => {
                      hand.lerp = 0.2 + i * 0.08
                      hand.x = 131 + i * 32
                      hand.y = 18 
                    })

                    hand.forEach((hand, i) => {
                      hand.lerp = 0.2 + i * 0.08
                      hand.x = 131 + i * 32
                      hand.y = 140
                    })
                    if (flop) {
                      flop.forEach((flop, i) => {
                        flop.x = this.x + i * 33
                        flop.y = this.y
                      })
                    }
                    if (turn) {
                      turn.x = this.x + 4 * 33
                      turn.y = this.y
                    }
                    if (river) {
                      river.x = this.x + 5 * 33
                      river.y = this.y
                    }
                  })
                })
              }

}
