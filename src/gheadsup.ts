import { ticks } from './shared'
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
import { HasPositionCard } from './gsolitaire'


export class HeadsUp {
  
  middle: Middle
  
  constructor() {}
  

}


class Middle {

  flop: Signal<[HasPositionCard, HasPositionCard, HasPositionCard] | undefined>
  turn: Signal<HasPositionCard | undefined>
  river: Signal<HasPositionCard | undefined>

  constructor(flop?: [HasPositionCard, HasPositionCard, HasPositionCard],
              turn?: HasPositionCard,
              river?: HasPositionCard) {
                this.flop = createSignal(flop)
                this.turn = createSignal(turn)
                this.river = createSignal(river)


                createEffect(() => {
                  let flop = read(this.flop),
                    turn = read(this.turn),
                    river = read(this.river)

                  batch(() => {
                    if (flop) {
                      flop.forEach((flop, i) => {
                        _.x = this.x + i * 33
                        _.y = this.y
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
