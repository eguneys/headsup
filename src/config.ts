import { uci_headsup } from './poker/format/uci'

export type Fen = string

export type Config = {
  fen?: Fen,
  fen0?: Fen,
}

export type State = {
  fen: Fen,
  fen0: Fen,
  headsup: HeadsUp,
}

export const initial_fen = '1 -/-'

export const defaults = () => ({
  fen: initial_fen,
  fen0: initial_fen,
  headsup: uci_headsup(initial_fen)
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

