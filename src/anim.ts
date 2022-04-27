import { Solitaire as GSolitaire } from './gsolitaire'
import { Solitaire as OSolitaire } from './solitaire'


export default class Anim {

  front: GSolitaire
  back: OSolitaire

  ssolitaire: SSolitaire

  constructor(ssolitaire: SSolitaire) {
    this.back = ssolitaire.front
  }


  set_front() {
    let { back } = this
    this.front =  new GSolitaire(
      this,
      back.piles.map(_ => _[0]),
        back.piles.map(_ => _[1]),
        back.holes
    )
  }


  set_back(mutation: (_: OSolitaire) => OSolitaire) {
    let new_back = mutation(back)



    this.back = new_back
  }
}
