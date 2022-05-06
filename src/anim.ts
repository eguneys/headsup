import { HeadsUp as GHeadsUp } from './gheadsup2'
import { fen_headsup_round_pov, HeadsUpRoundPov } from 'cardstwo'
import { same } from './util'
import { aww_who, aww_ontop, aww_action_type } from 'cardstwo'

import { createEffect } from 'soli2d-js'

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

    this.front.pov = this.back
  }

  s_set_config(config: Config) {
    if (config.fen) {
      this.s_set_back(fen_headsup_round_pov(config.fen))
    }
    console.log(config.fen, this.back.allowed_actions.map(aww_action_type), this.back.allowed_actions.map(aww_ontop))
    this.fold_after = config.fold_after
    console.log(this.back.current_who, this.back.allowed_actions.map(aww_who))

    this.front.fold_after = this.fold_after
  }

  _set_front() {
    this.front = new GHeadsUp(this.back, this.fold_after)

    createEffect(() => {
      let action = this.front.on_action

      if (action) {
        this.g_action(action)
      }
    })
  }

}
