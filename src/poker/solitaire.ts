import { deck, Card, card, card_suit, card_rank } from './types'

export type Pile = Array<Card>

export type WasteHoleOrPileIndex = 1 | 2 | 3
export type SolIndex = number

export function sol_index(windex: WasteHoleOrPileIndex, pile_index: number) {
  return windex * 100 + pile_index
}
export function sol_index_w(sol: SolIndex) {
  return Math.floor(sol / 100)
}

export function sol_index_p(sol: Index) {
  return sol % 100
}


export class Solitaire {

  static readonly Waste: WasteHoleOrPileIndex = 1
  static readonly Pile: WasteHoleOrPileIndex = 2
  static readonly Hole: WasteHoleOrPileIndex = 3


  static make = () => {
    let _deck = deck.slice(0)

    let piles = []
    for (let i = 0; i < 7; i++) {
      piles.push([
        _deck.splice(0, i)
        _deck.splice(0, 1)])
    }

    let holes = [[], [], [], []]


    return new Solitaire(piles, holes)
  }

  get clone() {
    let holes = this.holes.map(_ => _.slice(0))
    let piles = this.piles.map(_ =>
                               [_[0].slice(0),
                                 _[1].slice(0)])

    return new Solitaire(piles, holes)
  }

  constructor(readonly piles: Array<[Pile, Pile]>,
              readonly holes: Array<Pile>) {
  }

  _cut(orig: SolIndex) {
    let s2 = this.clone
    switch(sol_index_w(orig)) {
      case Solitaire.Pile:
        let pindex = sol_index_p(orig)
        
        let [back, front] = s2.piles[pindex]

        if (front[pindex]) {
          let reveal
          let stack = front.splice(pindex, front.length - 1)
          if (front.length === 0 && back.length > 0) {
            reveal = back.pop()
            front.push(reveal)
          }

          return [s2, stack, reveal]
        }

        break
    }
  }

  drop(orig: SolIndex, dest: SolIndex) {
    let s2pile = _cut(orig)

    if (s2pile) {
      let [s2, pile, reveal] = s2pile
      return s2._paste(dest, pile)
    }
  }
}
