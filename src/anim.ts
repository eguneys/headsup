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

  g_showdown() {
    this.config.on_showdown?.()
  }

  s_set_back(back: HeadsUpRoundPov) {
    let back0 = this.back
    this.back = back

    this.front.pov = this.back
  }

  s_set_config(config: Config) {
    if (config.fen) {
      this.s_set_back(fen_headsup_round_pov(config.fen))
      console.log(config.fen, fen_headsup_round_pov(config.fen).left_stacks)
    }
    this.fold_after = config.fold_after

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

    createEffect(() => {
      this.front.on_showdown

      this.g_showdown()
    })
  }

}
