export default function Api(play: AllPlays) {

  return {
    set(config: Config) { 
      if (play.config.fen !== config.fen0) {
        //sync
        play.remove()
        play._set_data(config)
        .init()
        .add_after_init()
        return
      }

      play
      .apply_diff(config)

    }
  }

}
