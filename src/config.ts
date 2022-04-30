import { ActionWithWho } from 'cardstwo'

export type Fen = string

export type Config = {
  fen?: Fen
  time?: number,
  on_action?: (aww: ActionWithWho) => void
}
