import { configure } from './config'

export default function Api(play: AllPlays) {

  return {
    set(config: Config) { 

      let fen0 = play.state.fen

      let state = configure(play.state, config)

      if (config.fen) {
        if (fen0 !== state.fen0) {
          //sync
          play.remove()
          play._set_data(state)
          .init()
          .add_after_init()
          return this
        }
      }

      play
      .apply_diff(state)

      return this
    }
  }

}

