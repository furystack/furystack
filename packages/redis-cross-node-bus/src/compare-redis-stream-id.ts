/**
 * Compares two Redis stream entry IDs of the form `<ms>-<seq>`. Returns a
 * negative number when `a` precedes `b`, zero when equal, a positive number
 * when `a` follows `b`.
 *
 * Lexicographic comparison is wrong: `'9-0'` would sort after `'10-0'`. The
 * helper splits on `-`, compares the millisecond component numerically first,
 * then the sequence component as the tiebreaker — matching the order Redis
 * itself imposes on `XADD *`-issued IDs.
 *
 * Special Redis IDs (`'-'`, `'+'`, `'$'`) are not handled: this helper is
 * scoped to IDs the adapter has issued or received off the wire.
 */
export const compareRedisStreamId = (a: string, b: string): number => {
  const [aMs, aSeq] = parseId(a)
  const [bMs, bSeq] = parseId(b)
  if (aMs !== bMs) return aMs - bMs
  return aSeq - bSeq
}

const parseId = (id: string): [number, number] => {
  const dash = id.indexOf('-')
  if (dash < 0) return [Number(id), 0]
  return [Number(id.slice(0, dash)), Number(id.slice(dash + 1))]
}
