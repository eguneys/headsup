import { Solitaire as GSolitaire } from './gsolitaire'
import { Solitaire as OSolitaire } from './solitaire'
import { pile_sol, SolMove, sol_move } from 'cardstwo'
import { same } from './util'

export default class Anim {

  front: GSolitaire
  back: OSolitaire

  constructor(readonly ssolitaire: SSolitaire) {
    this.back = ssolitaire.front
    ssolitaire.on_front_updated = this.s_front_updated
  }

  s_front_updated = () => {
    this.set_back(() => this.ssolitaire.front) 
  }

  g_drag_drop(orig: SolIndex, dest: SolIndex) {
    let ok = this.set_back(_ => _.drop(orig, dest))

    if (ok) {
      this.ssolitaire.send_move(sol_move(orig, dest))
    }
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

    if (!new_back) {
      return false
    }

    let b0s = this.back.piles.map(_ => _[0]),
      bs = new_back.piles.map(_ => _[0])

    let bdiff = b0s.map((_, i) => bs[i] - _)

    let p0s = this.back.piles.map(_ => _[1]),
      ps = new_back.piles.map(_ => _[1])

    let removeds = [],
      addeds = [],
      differents = []

    p0s.forEach((p0, i) => {
      let _i = pile_sol(i, 0)
      let p = ps[i]
      let d = bdiff[i]

      if (p.length === p0.length) {
        if (!same(p, p0)) {
          differents.push(_i)
        }
      } else if (p.length < p0.length) {
        if (!same(p, p0.slice(0, p.length))) {
          differents.push(_i)
        } else {
          removeds.push([pile_sol(i, p.length), p0.slice(p.length, p0.length)])
        }
      } else {
        if (!same(p.slice(0, p0.length), p0)) {
          differents.push(_i)
        } else {
          addeds.push([_i, p.slice(p0.length, p.length)])
        }
      }
    })

    console.log(p0s, ps)
    console.log(addeds, removeds, differents)

    this.front.a_diffs(addeds, removeds)

    new_back.reveals.forEach(_ => this.front.a_wait_reveal(_))

    this.back = new_back

    return true
  }
}
