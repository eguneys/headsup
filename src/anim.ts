import { HeadsUp as GHeadsUp } from './gheadsup'
import { fen_headsup_round_pov, HeadsUpRoundPov } from 'cardstwo'
import { same } from './util'

export default class Anim {

  front: GHeadsUp
  back: HeadsUpRoundPov
  fold_after?: number

  constructor(readonly config: Config) {
    let back = fen_headsup_round_pov(config.fen)
    this.back = back
    this.fold_after = config.fold_after
  }

  g_action(aww: ActionWithWho) {
    this.config.on_action?.(aww)
  }

  s_set_back(back: HeadsUpRoundPov) {
    let back0 = this.back
    this.back = back

    this.front.a_diff(back0)
  }

  s_set_config(config: Config) {
    if (config.fen) {
      this.s_set_back(fen_headsup_round_pov(config.fen))
    }
    let fold_after0 = this.fold_after
    this.fold_after = config.fold_after

    this.front.a_time(fold_after0)
  }

  _set_front() {
    this.front = new GHeadsUp(this)
  }

}
