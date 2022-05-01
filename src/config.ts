import { ActionWithWho } from 'cardstwo'

export type Fen = string

export type Config = {
  fen?: Fen
  fold_after?: number,
  on_action?: (aww: ActionWithWho) => void
}
