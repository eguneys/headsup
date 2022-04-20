import { card, is_headsup_index, headsup_pov } from '../types'

export const suits = ['h', 'd', 's', 'c']
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', '?']


export function uci_headsup(uci: string) {

  let [_pov_index, _stacks, _turn_index, _start_timestamp, _hands, _middle] = uci.split(' ')


  let pov_index = uci_hu_index(_pov_index)
  if (!pov_index) {
    return
  }
  let pov_stacks = headsup_pov(
    _stacks.split('/').map(uci_stack),
    pov_index)

  if (pov_index) {

    let turn_index = uci_hu_index(_turn_index)

    if (turn_index) {

      let turn_time = parseInt(_start_timestamp)
      let pov_hands = headsup_pov(
        _hands.split('/')
        .map(uci_hand)
        .filter(Boolean), 
        pov_index)

      let middle = uci_middle(_middle)

      if (turn_time && pov_hands.length === 2 && middle) {

        return {
          pov_index,
          pov_stacks,
          turn_index,
          turn_time,
          pov_hands,
          middle
        }
      }
    }

    return {
      pov_index,
      pov_stacks
    }
  }

}

export function uci_stack(uci: string) {
  let res = parseInt(uci)
  if (res) {
    return res
  }
}

const hu_indexes = ['1', '2']
export function uci_hu_index(uci: string) {
  let res = hu_indexes.indexOf(uci) + 1

  if (is_headsup_index(res)) {
    return res
  }
}

export function uci_card(uci: string) {
  let suit = suits.indexOf(uci.slice(-1)) + 1

  if (suit >= 1 && suit <= 4) {
    let rank = ranks.indexOf(uci.slice(0, -1)) + 1

    if (rank >= 1 && rank <= 14) {
      return card(suit, rank)
    }
  }
}

export function uci_hand(uci: string) {
  if (uci.length === 2 * 2) {
    let first = uci_card(uci.substring(0, 2)),
      second = uci_card(uci.substring(2, 4))
    if (first && second) {
      return [first, second]
    }
  }
     
}

export function uci_middle(uci: string) {

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

