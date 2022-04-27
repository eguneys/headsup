import { deck, Solitaire } from 'cardstwo'
import { fen_solitaire } from './fen'

export default class SSolitaire {

  _solitaire?: Solitaire


  get front() {
    if (this._solitaire) {
      return fen_solitaire(this._solitaire.fen)
    }
  }

  constructor() {}


  new_game() {
    let _deck = deck.slice(0)
    this._solitaire = Solitaire.make(_deck) 
  }
}
