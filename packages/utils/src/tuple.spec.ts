import { tuple } from './tuple'
import { describe, expect, it } from 'vitest'

describe('Tuple', () => {
  it('Should return a Tuple object', () => {
    expect(tuple('a', 'b', 'c')).toEqual(['a', 'b', 'c'])
  })
})
