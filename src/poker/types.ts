export type Suit = 1 | 2 | 3 | 4
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

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

export const suits = [1, 2, 3, 4]
export const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export const deck = 
  suits.map(suit =>
            ranks.map(rank =>
                      card(suit, rank)))
