import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d'
import { HasPlaysParent, PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red, green } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './config'

import { is_hidden, HeadsUp as OHeadsUp, Cards as OCards, PovHands as OHands, Card as OCard } from './poker/types'

import { HeadsUpPov as Pov, headsup_pov } from './poker/types'


const Template = new Transform()

function vec_transform_matrix(vec: Vec2, transform: Transform) {
  return transform.world.mVec2(vec)
}

function vec_transform_inverse_matrix(vec: Vec2, transform: Transform) {
  return transform.world.inverse.mVec2(vec)
}

class DragDecay {
  static make = (drag: MouseDrag, orig: Transform) => {
    return new DragDecay2(drag, orig)
  }


  get translate() {
    return this.move.add(this.decay)
  }

  get move() {
    return vec_transform_inverse_matrix(Vec2.make(...this.drag.move), this.parent)
  }

  get parent() {
    return this.orig._parent
  }

  get drop() {
    return this.drag.drop
  }


  decay: Vec2
  start: Vec2


  constructor(readonly drag: MouseDrag,
              readonly orig: Transform) {
                this.start = Vec2.make(...drag.start)
                this.decay = orig.translate.sub(vec_transform_inverse_matrix(this.start, orig._parent))
              }

}

export type Handler = () => void;


export class TweenVal {

  static linear = t => t
  static quad_in = t => t * t
  static quad_out = t => -t * (t - 2)
  static quad_in_out = t => t<.5 ? 2*t*t : -1+(4-2*t)*t 
  static cubit_in = t => t * t * t

  _elapsed: number = 0

  get _i() {
    return Math.min(1, this._elapsed / this.duration)
  }

  get i() {
    return this.easing(this._i)
  }

  get value() {
    return this.a * (1 - this.i) + this.b * this.i
  }

  _i0: number

  get has_reached() {
    return this.i === 1 && this._i0 !== this.i
  }

  constructor(readonly a: number,
              readonly b: number,
              readonly duration: number = ticks.sixth,
              readonly easing: Easing = TweenVal.linear) {}

  new_b(b: number, duration = this.duration) {
    return new TweenVal(this.value,
                        b,
                        duration,
                        this.easing)
  }

  update(dt: number, dt0: number) {
    this._i0 = this.i
    this._elapsed += dt
  }

}

class Card extends HasPlaysParent {

  a_back = this.anim(0, 96, 30, 40)
  a_front = this.anim(0, 96, 30, 40)
  a_reveal = this.anim(90, 96, 30, 40)

  t_x!: TweenVal
  t_y!: TweenVal

  t_scale: TweenVal = new TweenVal(0.8, 1, ticks.half, TweenVal.quad_in_out)

  set x(value: number) {
    if (!this.t_x) {
      this.t_x = new TweenVal(value, value, ticks.half, TweenVal.quad_in_out)
    } else {
      this.t_x = this.t_x.new_b(value)
    }
  }

  set y(value: number) {
    if (!this.t_y) {
      this.t_y = new TweenVal(value, value, ticks.half, TweenVal.quad_in_out)
    } else {
      this.t_y = this.t_y.new_b(value)
    }
  }

  t_reveal!: TweenVal

  _has_reached_reveal: OCard
  set has_reached_reveal(card: OCard) {
    this._has_reached_reveal = card
  }

  _bg: Transform

  _init() {
    this.container = Template.clone

    let { a_back, a_front } = this
    a_back.frame = 1

    this._bg = a_back.template
    this._bg._set_parent(this.container)
  }

  _update(dt: number, dt0: number) {
    this.t_x.update(dt, dt0)
    this.t_y.update(dt, dt0)

    super.x = this.t_x.value
    super.y = this.t_y.value

    this.t_scale.update(dt, dt0)
    super.scale = this.t_scale.value

    if (this._has_reached_reveal && !is_hidden(this._has_reached_reveal)) {
      if (this.t_x.has_reached && this.t_y.has_reached) {
        if (!this.t_reveal) {
          this.t_reveal = new TweenVal(1, 5, ticks.half, TweenVal.quad_in_out)
        } 
      }
    }


    let { a_reveal } = this
    if (this.t_reveal) {
      this.t_reveal.update(dt, dt0)
      if (this.t_reveal.has_reached) {
        this._has_reached_reveal = undefined
        this.t_reveal = undefined
      } else {
        a_reveal.frame = Math.floor(this.t_reveal.value)
        this._bg.quad = a_reveal.quad
      }
    }
  }
}

class Middle extends HasPlaysParent {

  get deck_card() {
    let res =  new Card(this)
    .init()
    .add_after_init()

    res.x = 0
    res.y = 0

    return res
  }

  _flop?: [Card, Card, Card]
  _turn?: Card
  _river?: Card

  get flop_y() { 
    return 70
  }

  get flop_x() {
    return 20
  }

  set flop(flop?: [OCard, OCard, OCard]) {
    this._flop?.forEach(_ => _.remove())
    this._flop = flop?.map(_ => this.deck_card)
    this._flop?.map((_, i) => {
      _.x = this.flop_x + i * 32
      _.y = this.flop_y
      _.has_reached_reveal = _
    })
  }

  set turn(turn?: OCard) {
    this._turn?.remove()
    if (turn) {
      this._turn = this.deck_card
      this._turn.x = this.flop_x + 3 * 32 + 1
      this._turn.y = this.flop_y
      this._turn.has_reached_reveal = turn
    }
  }

  set river(river?: OCard) {
    this._river?.remove()
    if (river) {
      this._river = this.deck_card
      this._river.x = this.flop_x + 4 * 32 + 1
      this._river.y = this.flop_y
      this._river.has_reached_reveal = river
    }
  }

  _cards: OCards
  set cards(cards: OCards) {
    let { _cards } = this

    if (!_cards) {
      this.flop = cards.flop
      this.turn = cards.turn
      this.river = cards.river
    } else {
      if (!_cards.flop || !cards.flop) {
        this.flop = cards.flop
      }
      if (!_cards.turn || !cards.turn) {
        this.turn = cards.turn
      }
      if (!_cards.river || !cards.river) {
        this.river = cards.river
      }
    }

    this._cards = cards
  }

  _init() {
    this.container = Template.clone
  }
}


class HandCards extends HasPlaysParent {

  get deck_card() {
    let res =  new Card(this)
    .init()
    .add_after_init()

    res.x = 0
    res.y = 0

    return res
  }


  _op?: [Card, Card]
  _me?: [Card, Card]

  me_pos = Vec2.make(80, 120)
  op_pos = Vec2.make(80, 10)

  set op(op?: [OCard, OCard]) {
    this._op?.forEach(_ => _.remove())
    this._op = op?.map(_ => this.deck_card)

    let { op_pos } = this

    this._op?.map((_, i) => {
      _.x = op_pos.x + i * 32
      _.y = op_pos.y + 10
      _.has_reached_reveal = op[i]
    })
  }


  set me(me?: [OCard, OCard]) {
    this._me?.forEach(_ => _.remove())
    this._me = me?.map(_ => this.deck_card)

    let { me_pos } = this

    this._me?.map((_, i) => {
      _.x = me_pos.x + i * 32
      _.y = me_pos.y + 10
      _.has_reached_reveal = me[i]
    })
  }

  _hands?: OHands

  set hands(hands?: OHands) {
    let { _hands } = this

    if (!_hands) {
      this.op = hands?.op
      this.me = hands?.me
    } else {
      if (!_hands.op || !hands?.op) {
        this.op = hands?.op
      }
      if (!_hands.me || !hands?.me) {
        this.me = hands?.me
      }
    }
    this._hands = hands
  }

  _init() {
    this.container = Template.clone
  }
}


class Seat extends HasPlaysParent {

  a_seat_bg = this.anim(0, 144, 33, 32)

  a_bg = this.anim(480, 16, 29, 39)
  a_timer_bg = this.anim(464, 16, 6, 31)

  a_timer_green = this.colors.quad(green, 1)
  a_timer_red = this.colors.quad(red, 2)

  t_timer: Transform
  t_fg: Transform

  _i_left?: TweenVal


  get bar_color() {
    return this.bar_height < 20 ? this.a_timer_green : this.a_timer_red
  }

  get bar_height() {
    return (this.left !== undefined) ? 30 - (this.left / 30) * 30 : 0
  }

  set _left(seconds?: number) {
    if (this._i_left) {
      this.t_timer._remove()
    }

    if (seconds !== undefined) {
      this._i_left = new TweenVal(seconds, 0, ticks.seconds * seconds)
    } else {
      this._i_left = undefined
    }


    if (this._i_left) {
      this.t_timer._set_parent(this.container)
    }
  }

  set start(timestamp?: number) {
    if (timestamp) {
      this._left = Math.max(0, (timestamp - Date.now()) / 1000)
    } else {
      this._left = undefined
    }
  }

  get left() {
    return this._i_left?.value
  }

  t_empty: Transform
  t_full: Transform

  t_empty_bg: Transform

  _avatar?: string

  _i_sit_anim: TweenVal = new TweenVal(0, 0, ticks.sixth, TweenVal.quad_in_out)

  set avatar(avatar: string) {
    if (!this._avatar && avatar) {
      this.t_empty._remove()
    } else if (this._avatar && !avatar) {
      this.t_full._remove()
    }

    this._avatar = avatar

    if (this._avatar) {
      this.t_full._set_parent(this.container)
    } else {
      this.t_empty._set_parent(this.container)
    }
  }

  get avatar() {
    return this._avatar
  }

  _init() {

    this.container = Template.clone

    this.t_full = Template.clone
    this.t_empty = Template.clone


    let { a_seat_bg } = this

    this.t_empty_bg = a_seat_bg.template
    this.t_empty_bg._set_parent(this.t_empty)

    let { a_bg, a_timer_bg } = this

    let bg = a_bg.template
    bg._set_parent(this.t_full)

    this.t_timer = Template.clone

    let t_bg = a_timer_bg.template
    t_bg._set_parent(this.t_timer)
    t_bg.x = 29 
    t_bg.y = 5

    let { a_timer_green, a_timer_red } = this

    this.t_fg = Template.clone
    this.t_fg.quad = a_timer_red
    this.t_fg.size = Vec2.make(4, 0)
    this.t_fg.x = 30 
    this.t_fg.y = 25

    this.t_fg._set_parent(this.t_timer)
  }


  _update(dt: number, dt0: number) {

    if (!this.avatar) {

      let { hover, click } = this.mouse

      if (hover) {
        let hit =  vec_transform_inverse_matrix(Vec2.make(...hover), this.t_empty._children[0])
        if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
          if (this._i_sit_anim.i === 1) {
            this._i_sit_anim = this._i_sit_anim.new_b(this._i_sit_anim.value === 0 ? 2.999 : 0)
          }
        }
      }

      if (click) {
        let hit =  vec_transform_inverse_matrix(Vec2.make(...click), this.t_empty._children[0])
        if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
          this.plays.on_sit()
        }
      }
    }


    this._i_sit_anim.update(dt, dt0)

    this._i_left?.update(dt, dt0)

    this.t_fg.quad = this.bar_color
    this.t_fg.y = 35-this.bar_height
    this.t_fg.size.y = this.bar_height

    let { a_seat_bg } = this

    a_seat_bg.frame = Math.floor(this._i_sit_anim.value)
    this.t_empty_bg.quad = a_seat_bg.quad
  }
}

class Stack extends HasPlaysParent {

  a_bg = this.anim(50, 16, 50, 13)

  _init() {

    this.container = Template.clone

    let { a_bg } = this

    let bg = a_bg.template
    bg._set_parent(this.container)
  }


}

class HeadsUp extends WithPlays {

  get state() { return this.data as State }

  get headsup() { return this.state.headsup }

  get pov_index() { return this.headsup.pov_index }
  get ostacks() { return this.headsup.pov_stacks }

  get omiddle() { return this.headsup.middle }

  middle: Middle
  hand_cards: HandCards
  stacks: Pov<Stack>
  seats: Pov<Seat>

  _init() {

    this.container = Template.clone

    this.middle = new Middle(this)
    .init()
    .add_after_init()

    this.hand_cards = new HandCards(this)
    .init()
    .add_after_init()

    this.seats = headsup_pov([
      new Seat(this)
      .init()
      .add_after_init(),
      new Seat(this)
      .init()
      .add_after_init()
    ], this.pov_index)

    this.seats.me.x = 80
    this.seats.me.y = 130
    this.seats.op.x = 80
    this.seats.op.y = 10

    this.seats.me.avatar = this.ostacks.me
    this.seats.op.avatar = this.ostacks.op


    this.middle.flop = this.omiddle.flop
    this.middle.turn = this.omiddle.turn
    this.middle.river = this.omiddle.river
  }
}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)


  get state(): State {
    return this.data as State
  }

  on_sit() {
    console.log('sit')
  }

  headsup!: HeadsUp

  _init() {
    this.container = Template.clone

    this.headsup = new HeadsUp(this)
    ._set_data(this.state)
    .init()

    this.headsup.add_after_init()
  }

  apply_diff(state: State) {
    this._set_data(state)
    this.headsup.oheadsup = this.state.headsup
  }

  _update(dt: number, dt0: number) {
    this.headsup.update(dt, dt0)
  }
}
