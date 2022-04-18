import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d'
import { HasPlaysParent, PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './play-config'

import { Middle as OMiddle, Card as OCard } from './gpoker'


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

  a_front = this.anim(0, 96, 30, 40)

  t_x: TweenVal = new TweenVal(0, 0, ticks.half, TweenVal.quad_in_out)
  t_y: TweenVal = new TweenVal(0, 0, ticks.half, TweenVal.quad_in_out)

  set x(value: number) {
    this.t_x = this.t_x.new_b(value)
  }

  set y(value: number) {
    this.t_y = this.t_y.new_b(value)
  }

  _init() {

    this.container = Template.clone

    let { a_front } = this

    let front = a_front.template
    front._set_parent(this.container)
  }

  move_to(parent: WithPlays) {
    return new Card(parent)
    ._set_data(this.data)
    .init()
    .add_after_init()
  }

  _update(dt: number, dt0: number) {
    this.t_x.update(dt, dt0)
    this.t_y.update(dt, dt0)

    super.x = this.t_x.value
    super.y = this.t_y.value
  }
}

type MiddleCards = {
  flop?: [Card, Card, Card],
  turn?: Card,
  river?: Card
}

class Middle extends HasPlaysParent {

  get cards() { return this.data as MiddleCards }

  flop?: [Card, Card, Card]
  turn?: Card
  river?: Card

  _init() {
    this.container = Template.clone

    let { flop, turn, river } = this.cards

    this.flop = flop?.map(_ => _.move_to(this))
    this.turn = turn?.move_to(this)
    this.river = river?.move_to(this)

    if (this.flop) {
      this.flop.map((_, i) => _.x = i * 32)
    }
    if (this.turn) {
      this.turn.x = 3 * 32 + 1
    }

    if (this.river) {
      this.river.x = 4 * 32 + 1
    }
  }
}

class HeadsUp extends WithPlays {


  middle: Middle

  _init() {

    this.container = Template.clone


    let flop = [
      new Card(this).init(),
      new Card(this).init(),
      new Card(this).init(),
    ]
    let turn = new Card(this).init()
    let river = new Card(this).init()


    this.middle = new Middle(this)
    ._set_data({
      flop,
      turn,
      river
    })
    .init()
    .add_after_init()
    this.middle.x = 20
    this.middle.y = 70

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
    ._set_data({})
    .init()


    this.headsup.add_after_init()
  }

  _update(dt: number, dt0: number) {
    this.headsup.update(dt, dt0)
  }
}
