import { ticks } from './shared'
import Mouse from './mouse'
import { createRoot, untrack, createMemo, onCleanup, on, batch, createSignal, createEffect } from 'soli2d-js'
import { Vec2 } from 'soli2d-js/web'
import { vec_transform_inverse_matrix } from './play'
import { read, write, owrite } from './play'
import { useApp } from './app'

export type OCard = number

export class LerpVal {

  _b: Signal<number>

  _i: Signal<number>

  get value() {
    return read(this._i)
  }

  lerp: number = 0.5

  constructor(a: number, b: number = a) {
    this._b = createSignal(b)
    this._i = createSignal(a)

    let [{update}] = useApp()

    createEffect(on(update, ([dt, dt0]) => {
      let value = this.lerp
      let dst = read(this._b)
      owrite(this._i, i => i * (1 - value) + dst * value)
    }))
  }


  new_b(b: number) {
    owrite(this._b, b)
  }
}

export abstract class HasPosition {


  _ref?: Transform

  duration: number

  _x: LerpVal
  _y: LerpVal

  get x() {
    return this._x.value
  }

  get y() {
    return this._y.value
  }

  set x(x: number) {
    this._x.new_b(x)
  }

  set y(y: number) {
    this._y.new_b(y)
  }

  set lerp(v: number) {
    this._x.lerp = v
    this._y.lerp = v
  }

  constructor(x: number, y: number) {
    this._x = new LerpVal(x)
    this._y = new LerpVal(y)
  }

  _set_ref = (ref: Transform) => {
    this._ref = ref
  }
  
  has_dropped(drop: Vec2) {
    if (this._ref) {

      let hit = vec_transform_inverse_matrix(drop, this._ref)

      if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
        return true
      }
    }
    return false
  }
}

export class HasPositionCard extends HasPosition {

  constructor(readonly card: Card, x: number, y: number, duration: number) {
    super(x, y, duration)
  }

}

export type CardStack = Array<HasPositionCard>

export class DragPile {

  _drag_pile!: Pile

  constructor(readonly solitaire: Solitaire, 
              readonly decay: DragDecay, 
              readonly stack: CardStack, 
              readonly orig: Pile) {

                createRoot(dispose => {

                  stack.forEach((_, i) => {
                    let _i = 1-(i / stack.length),
                      _i2 = (_i + 1) * (_i + 1) * (_i + 1) / 8
                    _.lerp = 0.1 + (_i2 * 0.5)
                  })

                  this._drag_pile = new Pile(solitaire, stack, decay.translate.x, decay.translate.y)

                  let [{mouse}] = useApp()

                  createEffect(() => {
                    let { drag } = mouse()

                    this._drag_pile.x = decay.translate.x
                    this._drag_pile.y = decay.translate.y

                    if (drag.drop) {
                      solitaire.drop(Vec2.make(...drag.drop))
                      dispose()
                    }
                  })
                })
  }
}

export class Solitaire {

  static make = () => {

    let _piles = [
      [1, 2, 3, 4, 5, 6],
      [1,2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      [],
      [],
      [1,2,3],
      [1,2,3],
      [1]
    ]

    let _holes = [
      [1,2],
      [1],
      [1],
      [1,2]
    ]

    return new Solitaire(_piles, _holes)
  }

  piles: Array<Pile>
  holes: Array<Pile>

  drag_pile: Signal<DragPile | undefined>

  constructor(piles: Array<Array<OCard>>, 
              holes: Array<Array<OCard>>) {
    this.piles = piles.map((_, i) => {
      let x = 50 + i * 33,
        y = 12

      let stack = _.map(_ => new HasPositionCard(_, x, y))
      return new Pile(this, stack, x, y)
    })


    this.holes = holes.map((_, i) => {
      let x = 283,
      y = 12 + i * 42

      let stack = _.map(_ => new HasPositionCard(_, x, y))
      return new Pile(this, stack, x, y, 0)
    })

    this.drag_pile = createSignal()
  }

  drag(drag_pile: DragPile) {
    owrite(this.drag_pile, drag_pile)
  }

  drop(drop: Vec2) {
    let drag_pile = read(this.drag_pile)

    let dropped_pile = this.piles.find(_ => _.has_dropped_on_top(drop))
    let hole_drop = this.holes.find(_ => _.has_dropped_on_top(drop))

    if (dropped_pile) {
      dropped_pile.add_stack(drag_pile.stack)
    } else if (hole_drop) {
      hole_drop.add_stack(drag_pile.stack)
    } else {
      drag_pile.orig.add_stack(drag_pile.stack)
    }

    owrite(this.drag_pile, undefined)
  }
}

export class Pile extends HasPosition {

  gap: number
  pile: Signal<CardStack>

  constructor(readonly solitaire: Solitaire, 
              pile: CardStack,
              x: number,
              y: number,
              gap: number = 8) {
                super(x, y, ticks.one)
    this.pile = createSignal(pile, { equals: false })

    this.gap = gap

    createEffect(() => {
      read(this.pile).forEach((_, i, arr) => {
        let _i = 1-(i / arr.length),
          _i2 = (_i + 1) * (_i + 1) * (_i + 1) / 8

        batch(() => {
          _.lerp = 0.1 + (_i2 * 0.1)
          _.x = this.x
          _.y = this.y + i * this.gap
        })
      })
    })
  }

  has_dropped_on_top(drop: Vec2) {
    let _pile = read(this.pile)

    if (_pile.length > 0) {
      return _pile[_pile.length-1].has_dropped(drop)
    } else {
      return this.has_dropped(drop)
    }
  }

  begin_drag(i: number, decay: DragDecay) {
    let { pile, solitaire } = this
    let [{update}] = useApp()
    write(pile, _ => {
      let stack = _.splice(i, _.length)
      let drag_pile = new DragPile(solitaire, decay, stack, this)
      solitaire.drag(drag_pile)
    })
  }


  add_stack(stack: Stack) {
    
    owrite(this.pile, _ => {
      return _.concat(stack)
    })
  }
}



export class TweenVal {

  static linear = t => t
  static quad_in = t => t * t
  static quad_out = t => -t * (t - 2)
  static quad_in_out = t => t<.5 ? 2*t*t : -1+(4-2*t)*t 
  static cubit_in = t => t * t * t

  _elapsed: Signal<number> = createSignal(0)

  get _i() {
    return Math.min(1, read(this._elapsed) / this.duration)
  }

  get i() {
    return this.easing(this._i)
  }

  get has_reached() {
    return this.i === 1 && this._i0 !== this.i
  }

  get a() {
    return read(this._a)
  }

  get b() {
    return read(this._b)
  }

  _i0: number

  _a: Signal<number>
  _b: Signal<number>
  duration: number
  easing: Easing

  _value: Memo<number>


  get value() {
    return this._value()
  }

  constructor(a: number,
              b: number,
              duration: number = ticks.sixth,
              easing: Easing = TweenVal.linear) {

                this._a = createSignal(a)
                this._b = createSignal(b)

                this.duration = duration
                this.easing = easing

                this._value = createMemo(() => {
                  return this.a * (1 - this.i) + this.b * this.i
                })

                let [{update}] = useApp()

                createEffect(on(update, ([dt, dt0]) => {
                  this._i0 = this.i
                  owrite(this._elapsed, _ => _ += dt)
                }))
              }

  new_b(b: number, duration = this.duration) {
    this.duration = duration
    batch(() => {
      owrite(this._b, b)
      untrack(() => {
        if (read(this._elapsed) > this.duration) {
          owrite(this._elapsed, 0)
        }
      })
    })
  }
}


