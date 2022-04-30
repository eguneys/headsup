import { HeadsUp as GHeadsUp } from './gheadsup'
import { fen_headsup_round_pov, HeadsUpRoundPov } from 'cardstwo'
import { same } from './util'

export default class Anim {

  front: GHeadsUp
  back: HeadsUpRoundPov
  time?: number

  constructor(readonly config: Config) {
    let back = fen_headsup_round_pov(config.fen)
    this.back = back
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
    let time0 = this.time
    this.time = config.time

    this.front.a_time(time0)
  }

  _set_front() {
    this.front = new GHeadsUp(this)
  }

}
