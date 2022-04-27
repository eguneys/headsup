import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d-js/web'
import { dark, red, green } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './config'

import { createSignal, batch } from 'soli2d-js'

export function owrite(signal, fn) {
  if (typeof fn === 'function') {
    return signal[1](fn)
  } else {
    signal[1](_ => fn)
  }
}

export function write(signal, fn) {
  return signal[1](_ => {
    fn(_)
    return _
  })
}

export function read(signal) {
  if (Array.isArray(signal)) {
    return signal[0]()
  } else {
    return signal()
  }
}

export function vec_transform_matrix(vec: Vec2, transform: Transform) {
  return transform.world.mVec2(vec)
}

export function vec_transform_inverse_matrix(vec: Vec2, transform: Transform) {
  return transform.world.inverse.mVec2(vec)
}

export class DragDecay {
  static make = (drag: MouseDrag, orig: Transform) => {
    return new DragDecay(drag, orig)
  }


  get translate() {
    return this.drag_move.add(this.decay)
  }

  get move() {
    return vec_transform_inverse_matrix(this.drag_move, this.parent)
  }

  get drag_move() {
    return Vec2.make(...this.drag.move)
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
