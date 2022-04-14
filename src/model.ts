export type Suit = 1 | 2 | 3 | 4
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type Card = number

export function card(suit: Suit, rank: Rank) {
  return suit * 13 + rank
}

export function card_suit(card: Card) {
  return Math.floor(card / 13)
}

export function card_rank(card: Card) {
  return card % 13
}


export type Middle = {
  flop?: [Card, Card, Card],
  turn?: Card,
  river?: Card
}
