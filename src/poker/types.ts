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

export type HeadsUpPov<A> = {
  me: A,
  op: A
}

export function headsup_pov<A>(values: [A, A], me_index: number) {
  let me = values[me_index],
    op = values[(me_index + 1) % 2]

  return {
    me,
    op
  }
}

export function is_headsup_index(_: any): _ is HeadsUpIndex {
  return _ === 1 || _ === 2
}

export type Hand = [Card, Card]

export type Stack = number

export type HeadsUpIndex = 1 | 2

export type Timestamp = number

export type HeadsUp = {
  pov_index: HeadsUpIndex,
  pov_stacks: HeadsUpPov<Stack | undefined>,
  turn_index?: HeadsUpIndex,
  turn_time?: Timestamp,
  pov_hands?: HeadsUpPov<Hand>
  middle: Middle,
}
