import { tuple } from './tuple.js'
import { describe, it, expect } from 'vitest'

describe('Tuple', () => {
  it('Should return a Tuple object', () => {
    expect(tuple('a', 'b', 'c')).toEqual(['a', 'b', 'c'])
  })
})
