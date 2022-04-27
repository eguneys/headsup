import { Solitaire as GSolitaire } from './gsolitaire'
import { Card, Pile, card, card_suit, card_rank } from 'cardstwo'
import { sol_pile } from 'cardstwo'

export class Solitaire {

  get clone() {
    let holes = this.holes.map(_ => _.slice(0))
    let piles = this.piles.map(_ =>
                               ([_[0],
                                 _[1].slice(0)] as [Pile, Pile]))

    let reveals = this.reveals.slice(0)

    return new Solitaire(reveals, piles, holes)
  }

  constructor(readonly reveals: Array<number>,
              readonly piles: Array<[number, Pile]>,
              readonly holes: Array<Pile>) {}



  _cut_pile_in(orig: SolIndex): [Pile, Card | undefined] | undefined {
    let [pindex, index] = sol_pile(orig)
    let [back, front] = this.piles[pindex]

    if (front[index]) {
      let reveal
      let stack = front.splice(index)
      if (front.length === 0 && back > 0) {
        reveal = true
        this.reveals.push(pindex)
      }

      return [stack, reveal]
    }
  }

  _paste_pile_in(dest: SolIndex, pile: Pile) {
    let [pindex, index] = sol_pile(dest)
    let [back, front] = this.piles[pindex]

    front.push(...pile)
    return true
  }

  _cut_in(orig: SolIndex) {

    return this._cut_pile_in(orig)
  }

  _paste_in(dest: SolIndex, pile: Pile) {
    return this._paste_pile_in(dest, pile)
  }


  drop_in(orig: SolIndex, dest: SolIndex) {
    let pile_reveal = this._cut_in(orig)

    if (pile_reveal) {
      let [pile, reveal] = pile_reveal
      let ok = this._paste_in(dest, pile)

      if (ok) {
        return this
      }
    }
  }

  drop(orig: SolIndex, dest: SolIndex) {
    let { clone } = this
    return clone.drop_in(orig, dest)
  }

}
