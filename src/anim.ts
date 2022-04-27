import { Solitaire as GSolitaire } from './gsolitaire'
import { Solitaire as OSolitaire } from './solitaire'


export default class Anim {

  front: GSolitaire
  back: OSolitaire

  ssolitaire: SSolitaire

  constructor(ssolitaire: SSolitaire) {
    this.back = ssolitaire.front
  }

  g_drag_drop(orig: SolIndex, dest: SolIndex) {
    this.set_back(_ => _.drop(orig, dest))
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
    let new_back = mutation(this.back)


    let b0s = this.back.piles.map(_ => _[0]),
      bs = new_back.piles.map(_ => _[0])

    let bdiff = b0s.map((_, i) => bs[i] - _)

    let p0s = this.back.piles.map(_ => _[1]),
      ps = new_back.piles.map(_ => _[1])

    let removeds = [],
      addeds = []

    p0s.forEach((p0, i) => {
      let p = ps[i]


    })

    new_back.reveals.forEach(_ => this.front.a_wait_reveal(_))

    this.back = new_back
  }
}
