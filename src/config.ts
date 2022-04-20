import { uci_headsup } from './poker/format/uci'

export type Fen = string

export type PlayerConfig = {
  left?: number
}

export type Config = {
  fen?: Fen,
  fen0?: Fen,
  op?: PlayerConfig,
  me?: PlayerConfig
}

export type State = {
  fen: Fen,
  fen0: Fen,
  headsup: HeadsUp,
  op: PlayerConfig,
  me: PlayerConfig
}

export const defaults = () => ({
  fen: '',
  fen0: '',
  headsup: uci_headsup(''),
  op: {},
  me: {}
})

export function configure(state: State, config: Config): void {

  deepMerge(state, config)

  if (config.fen !== undefined) {
    state.headsup = uci_headsup(config.fen)
  }

  return state
}

function deepMerge(base: any, extend: any): void {
  for (const key in extend) {
    if (isObject(base[key]) && isObject(extend[key])) deepMerge(base[key], extend[key]);
    else base[key] = extend[key];
  }
}

function isObject(o: unknown): boolean {
  return typeof o === 'object';
}

