export type Suit = 1 | 2 | 3 | 4
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export type Card = number

export function card(suit: Suit, rank: Rank) {
  return suit * 20 + rank
}

export function card_suit(card: Card) {
  return Math.floor(card / 20)
}

export function card_rank(card: Card) {
  return card % 20
}

export function is_hidden(card: Card) {
  return card_rank(card) === 14
}

export type Middle = {
  flop?: [Card, Card, Card],
  turn?: Card,
  river?: Card
}

export type PovHands = {
  op: [Card, Card],
  me: [Card, Card]
}

export type HeadsUp = {
  middle: Middle,
  hands?: PovHands
}
