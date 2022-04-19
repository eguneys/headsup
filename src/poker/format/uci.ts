import { card } from '../types'

export const suits = ['h', 'd', 's', 'c']
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']

export function uci_card(uci: string) {
  let suit = suits.indexOf(uci.slice(-1)) + 1

  if (suit >= 1 && suit <= 4) {
    let rank = ranks.indexOf(uci.slice(0, -1)) + 1

    if (rank >= 1 && rank <= 13) {
      return card(suit, rank)
    }
  }
}

export function uci_cards(uci: string) {

  let flop,
  turn, river

  if (uci.length >= 2 * 3) {
    let first = uci_card(uci.substring(0, 2)),
      second = uci_card(uci.substring(2, 4)),
      third = uci_card(uci.substring(4, 6))
    if (first && second && third) {
      flop = [first, second, third]
    }
  }

  if (uci.length >= 2 * 4) {
    turn = uci_card(uci.substring(6, 8))
  }
  if (uci.length >= 2 * 5) {
    river = uci_card(uci.substring(8, 10))
  }

  return {
    flop,
    turn,
    river
  }
}

