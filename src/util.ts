export function same<A>(a: Array<A>, b: Array<A>) {
  return a.every((_, i) => _ === b[i])
}


