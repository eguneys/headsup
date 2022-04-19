import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d'
import { HasPlaysParent, PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './play-config'

import { Cards as OCards, Card as OCard } from './poker/types'
import { uci_cards } from './poker/format/uci'


const Template = new Transform()

function vec_transform_matrix(vec: Vec2, transform: Transform) {
  return transform.world.mVec2(vec)
}

function vec_transform_inverse_matrix(vec: Vec2, transform: Transform) {
  return transform.world.inverse.mVec2(vec)
}

function vec_hit(vec: Vec2, transform: Transform) {

  let { x1, y1, x2, y2 } = Rectangle.unit.transform(transform.world)

  let { x, y } = vec

  return (x1 < x && x < x2 && y1 < y && y < y2)
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

    if (this._has_reached_reveal) {
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

class Cards extends HasPlaysParent {

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

class HeadsUp extends WithPlays {


  get ocards() { return this.data as OCards }

  cards: Cards

  _init() {

    this.container = Template.clone

    this.cards = new Cards(this)
    .init()
    .add_after_init()

    this.cards.cards = this.ocards
  }


  apply_diff(cards: OCards) {
    this.cards.cards = cards
  }
}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)


  get config(): Config {
    return this.data as Config
  }

  headsup!: HeadsUp

  _init() {
    this.container = Template.clone

    this.headsup = new HeadsUp(this)
    ._set_data(uci_cards(this.config.fen))
    .init()

    this.headsup.add_after_init()
  }

  apply_diff(config: Config) {
    this._set_data(config)
    this.headsup.apply_diff(uci_cards(this.config.fen))
  }

  _update(dt: number, dt0: number) {
    this.headsup.update(dt, dt0)
  }
}
