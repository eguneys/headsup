import { ticks } from './shared'
import Mouse from './mouse'
import { createRoot, untrack, createMemo, onCleanup, on, batch, createSignal, createEffect } from 'soli2d-js'
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
                      orig.add_stack(stack)
                      solitaire.drop()
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

    return new Solitaire(_piles)
  }

  piles: Array<Pile>

  drag_pile: Signal<DragPile | undefined>

  constructor(piles: Array<Array<OCard>>) {
    this.piles = piles.map((_, i) => {
      let x = 50 + i * 33,
        y = 12

      let stack = _.map(_ => new HasPositionCard(_, x, y))
      return new Pile(this, stack, x, y)
    })

    this.drag_pile = createSignal()
  }

  drag(drag_pile: DragPile) {
    owrite(this.drag_pile, drag_pile)
  }

  drop() {
    let drag_pile = read(this.drag_pile)

    //drag_pile.pile.add(drag_pile.stack)


    owrite(this.drag_pile, undefined)
  }
}

export class Pile extends HasPosition {

  pile: Signal<CardStack>

  constructor(readonly solitaire: Solitaire, 
              pile: CardStack,
              x: number,
              y: number) {
                super(x, y, ticks.one)
    this.pile = createSignal(pile, { equals: false })

    createEffect(() => {
      read(this.pile).forEach((_, i, arr) => {
        let _i = 1-(i / arr.length),
          _i2 = (_i + 1) * (_i + 1) * (_i + 1) / 8

        batch(() => {
          _.lerp = 0.1 + (_i2 * 0.1)
          _.x = this.x
          _.y = this.y + i * 8
        })
      })
    })
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

                createEffect(() => {
                  if (this.i < 1)
                  console.log(this.i)
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


