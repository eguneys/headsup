import { uci_pile } from 'cardstwo'
import { Solitaire } from './solitaire'

export function fen_solitaire(fen: string) {
  let piles_holes = fen.split(' ')

  let _piles = piles_holes.slice(0, 7)
  let _holes = piles_holes.slice(7, 12)

  let piles = _piles.map(_ => {
    let [back, front] = _.split('/')

    return [parseInt(back), uci_pile(front)]
  })

  let holes = _holes.map(_ => uci_pile(_) || [])

  let reveals = []

  return new Solitaire(reveals,
                       piles,
                       holes)
}
