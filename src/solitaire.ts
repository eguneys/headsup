import { Solitaire as GSolitaire } from './gsolitaire'
import { Card, Pile, card, card_suit, card_rank } from 'cardstwo'


export class Api {

  readonly front: GSolitaire

  constructor() {
    this.front = Solitaire.make()
  }


}
