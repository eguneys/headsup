import { ticks } from './shared'
import Mouse from './mouse'
import { createRoot, untrack, createMemo, onCleanup, on, batch, createSignal, createEffect } from 'soli2d-js'
import { Vec2 } from 'soli2d-js/web'
import { vec_transform_inverse_matrix } from './play'
import { read, write, owrite } from './play'
import { useApp } from './app'

import { Card as OCard, Pile as OPile } from 'cardstwo'
import { pile_sol, hole_sol, sol_pile, sol_hole, is_hole_index, is_pile_index } from 'cardstwo'

import { HasPosition, LerpVal, LoopVal, TweenVal, PingPongVal } from './lerps'

import { Anim } from './anim'

import { same } from './util'

export class HasPositionCard extends HasPosition {

  i_reveal: PingPongVal


  get hide() {
    if (this.i_reveal.resolve === PingPongVal.A) {
      return this.i_reveal.value
    }
  }

  get reveal() {
    if (this.i_reveal.resolve === PingPongVal.B && !this.i_reveal.resolved) {
      return this.i_reveal.value
    }
  }

  get show() {
    if (this.i_reveal.resolve === PingPongVal.B && this.i_reveal.resolved) {
      return this
    }
  }

  get ping_pong() {
    if (this.i_reveal.resolve === undefined) {
      return this.i_reveal.value
    }
  }

  _card: Signal<OCard | undefined>

  get card() {
    return read(this._card)
  }

  set card(card?: OCard) {
    owrite(this._card, card)
  }


  waiting() {
    this.card = undefined
    this.i_reveal.resolve = undefined
  }

  constructor(x: number, y: number, card?: OCard) {
    super(x, y)

    this._card = createSignal(card)

    this.i_reveal = new PingPongVal(0, 1, ticks.half + ticks.thirds, TweenVal.quad_in_out)

    if (!card) {
      this.i_reveal.resolve = PingPongVal.A
    }

    createEffect(on(this._card[0], (value?: OCard, prev_value?: OCard) => {
      if (!!prev_value && !value) {
        this.i_reveal.resolve = PingPongVal.A
      }
      if (!prev_value && !!value) {
        this.i_reveal.resolve = PingPongVal.B
      }
    }))
 }
}

export type CardStack = Array<HasPositionCard>

export class Solitaire {

  back_piles: Array<Pile>
  piles: Array<Pile>
  holes: Array<Pile>

  drag_pile: Signal<DragPile | undefined>

  constructor(readonly anim: Anim,
              back_piles: Array<number>,
              piles: Array<Array<OCard>>, 
              holes: Array<Array<OCard>>) {

    
    this.back_piles = back_piles.map((_, i) => {
      let x = 50 + i * 33,
        y = 12

      let stack = [...Array(_).keys()].map(_ => new HasPositionCard(x, y))
      return new Pile(this, i, stack, x, y)
    })


    this.piles = piles.map((_, i) => {
      let x = 50 + i * 33,
        y = 12

      let stack = _.map(_ => new HasPositionCard(x, y, _, true))
      return new Pile(this, pile_sol(i, 0), stack, x, y)
    })


    this.holes = holes.map((_, i) => {
      let x = 283,
      y = 12 + i * 42

      let stack = _.map(_ => new HasPositionCard(x, y, _))
      return new Pile(this, hole_sol(i), stack, x, y, 0)
    })

    this.drag_pile = createSignal()


    createEffect(() => {
      this.back_piles
      .forEach((back_pile, i) =>
               this.piles[i].y = back_pile.back_on_top_y)
    })
  }

  a_diffs(addeds: Array<SolIndex, OPile>,
    removeds: Array<SolIndex, OPile>) {

    let drag_pile = read(this.drag_pile)

    removeds.forEach(removed => {
      addeds.find(added => {
        if (same(removed[1], added[1])) {
          if (removed[0] === drag_pile.orig) {
            this._drop_drag_pile(added[0])
            drag_pile = undefined
          }
        }
      })
    })
    
    if (drag_pile) {
      this._drop_drag_pile(drag_pile.orig)
    }
  }

  a_wait_reveal(index: number) {
    let pile = this.back_piles[index]
    pile.head.waiting()
  }

  drag(drag_pile: DragPile) {
    owrite(this.drag_pile, drag_pile)
  }

  drop(drop: Vec2, drag_pile: DragPile) {
    let dropped_pile_index = this.piles.findIndex(_ => _.has_dropped_on_top(drop))
    let dropped_hole_index = this.holes.findIndex(_ => _.has_dropped_on_top(drop))

    let drop_sol
    if (dropped_pile_index !== -1) {
      drop_sol = pile_sol(dropped_pile_index, 0)
    } else if (dropped_hole_index !== -1) {
      drop_sol = hole_sol(dropped_hole_index)
    }


    if (drop_sol) {
      this.anim.g_drag_drop(drag_pile.orig, drop_sol)
    } else {
      this._drop_drag_pile(drag_pile.orig)
    }
  }


  sol_pile(sol: SolIndex) {

    if (is_hole_index(sol)) {
      return this.holes[sol_hole(sol)]
    } else if (is_pile_index(sol)) {
      return this.piles[sol_pile(sol)[0]]
    }
  }

  _drop_drag_pile(_dest: SolIndex) {
    let drag_pile = read(this.drag_pile)
    let dest = this.sol_pile(_dest)
    dest.add_stack(drag_pile.stack)
    owrite(this.drag_pile, undefined)
  }
}

export class Pile extends HasPosition {

  gap: number
  pile: Signal<CardStack>


  get back_on_top_y() {
    return this.y + read(this.pile).length * this.gap
  }


  get empty() {
    return read(this.pile).length === 0
  }

  get head() {
    let pile = read(this.pile)
    return pile[pile.length -1 ]
  }

  get back_pile() {
    return this.solitaire.back_piles[this.index]
  }


  get opile() {
    let pile = read(this.pile)
    return pile.map(_ => _.card)
  }

  constructor(readonly solitaire: Solitaire, 
              readonly index: number,
              pile: CardStack,
              x: number,
              y: number,
              gap: number = 8,
              lerp_mul: number = 0.1) {
                super(x, y, ticks.one)
    this.pile = createSignal(pile, { equals: false })

    this.gap = gap

    createEffect(() => {
      read(this.pile).forEach((_, i, arr) => {
        let _i = 1-(i / arr.length),
          _i2 = (_i + 1) * (_i + 1) * (_i + 1) / 8

        batch(() => {
          _.lerp = 0.1 + (_i2 * lerp_mul)
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

    let orig_index = this.index + i

    write(pile, _ => {
      let stack = _.splice(i, _.length)
      let drag_pile = new DragPile(solitaire, decay, stack, orig_index)
      solitaire.drag(drag_pile)
    })
  }


  add_stack(stack: Stack) {
    
    owrite(this.pile, _ => {
      return _.concat(stack)
    })
  }
}


export class DragPile {

  _drag_pile!: Pile

  constructor(readonly solitaire: Solitaire, 
              readonly decay: DragDecay, 
              readonly stack: CardStack, 
              readonly orig: SolIndex) {

                createRoot(dispose => {

                  this._drag_pile = new Pile(solitaire, orig, stack, decay.translate.x, decay.translate.y, 8, 0.5)

                  let [{mouse}] = useApp()

                  createEffect(() => {
                    let { drag } = mouse()

                    this._drag_pile.x = decay.translate.x
                    this._drag_pile.y = decay.translate.y

                    if (drag.drop) {
                      solitaire.drop(Vec2.make(...drag.drop), this)
                      dispose()
                    }
                  })
                })
              }
}
