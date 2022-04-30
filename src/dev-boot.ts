import { default as app } from './main'
import { HeadsUpRound, ActionWithWho } from 'cardstwo'


export default function main(element: HTMLElement) {



  let hu = HeadsUpRound.make(2,
                             10,
  [100, 100])

  let pov = hu.pov_of(1)
  let api

  function on_action(aww: ActionWithWho) {
    let ok = hu.maybe_add_action(aww)
    let res = hu.pov_of(1)

    api.s_set_back(res)
  }

  app(element, { fen: pov.fen, on_action }).then(_api => {
    api = _api
  })

}
