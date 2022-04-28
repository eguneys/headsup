import { deck, Solitaire } from 'cardstwo'
import { fen_solitaire } from './fen'

import { SolMove, sol_move_orig_dest } from 'cardstwo'

export default class SSolitaire {

  _solitaire?: Solitaire


  get front() {
    if (this._solitaire) {
      return fen_solitaire(this._solitaire.fen)
    }
  }

  on_front_updated?: () => void

  constructor() {}


  new_game() {
    let _deck = deck.slice(0)
    this._solitaire = Solitaire.make(_deck) 
  }

  send_move(move: SolMove) {
    let [orig, dest] = sol_move_orig_dest(move)

    let res = this._solitaire.drop(orig, dest)

    if (res) {
      this._solitaire = res
      setTimeout(() => {
        this.on_front_updated?.()
      })
    }
  }

}
