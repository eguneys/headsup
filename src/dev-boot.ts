import { default as app } from './main'
import { HeadsUpGame, HeadsUpRound, ActionWithWho, WhoHasAction } from 'cardstwo'
import { random } from 'cardstwo'
import { aww_ontop } from 'cardstwo'

class Scheduler {
  schedule(fn: () => void, ms: number) {
    setTimeout(fn, ms)
  }
}

const scheduler = new Scheduler()

export default function main(element: HTMLElement) {

  function json(game: HeadsUpGame, _pov: WhoHasAction) {
    let pov = game.round.pov_of(_pov)
    let {fold_after } = game

    return {
      fen: pov.fen,
      fold_after
    }
  }


    function apply(aww: ActionWithWho) {
      game.apply(aww)
      let config = json(game, 1)
      api.s_set_config(config)
    }


    function ai(game: Game, _pov: WhoHasAction) {

      let { fold_after } = game

      console.log('ai ontop', game.round.allowed_actions.map(aww_ontop))
      let res = random(game.round.pov_of(_pov))

      if (res) {
        setTimeout(() => {
          apply(res)
        }, 500 + Math.random() * (fold_after - Date.now()) / 10)
      }
    }

    function on_new_action() {
      let config = json(game, 1)
      api.s_set_config(config)
      ai(game, 2)
    }

    function on_new_round() {
      let config = json(game, 1)
      api.s_set_config(config)
      ai(game, 2)
    }

  let game = HeadsUpGame.make(scheduler, on_new_action, on_new_round, 10)


  let api

  function on_action(aww: ActionWithWho) {
    apply(aww)
    ai(game, 2)
  }


  app(element, { ...json(game, 1), on_action }).then(_api => {
    api = _api
    ai(game, 2)
  })

}
