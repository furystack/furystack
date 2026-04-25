import { describe, expect, it } from 'vitest'
import { defineService, defineServiceAsync, isToken } from './define-service.js'

describe('defineService', () => {
  it('produces a token whose id is a fresh symbol', () => {
    const A = defineService({ name: 'test/A', lifetime: 'singleton', factory: () => 1 })
    const B = defineService({ name: 'test/A', lifetime: 'singleton', factory: () => 2 })
    expect(typeof A.id).toBe('symbol')
    expect(A.id).not.toBe(B.id)
    expect(A.id.description).toBe('test/A')
  })

  it('preserves the supplied name, lifetime, and isAsync flag', () => {
    const T = defineService({ name: 'test/Service', lifetime: 'scoped', factory: () => ({}) })
    expect(T.name).toBe('test/Service')
    expect(T.lifetime).toBe('scoped')
    expect(T.isAsync).toBe(false)
  })

  it('does not invoke the factory eagerly', () => {
    let called = 0
    defineService({
      name: 'test/Lazy',
      lifetime: 'transient',
      factory: () => {
        called += 1
        return called
      },
    })
    expect(called).toBe(0)
  })
})

describe('defineServiceAsync', () => {
  it('flags the token with isAsync=true', () => {
    const T = defineServiceAsync({
      name: 'test/AsyncService',
      lifetime: 'singleton',
      factory: async () => 'value',
    })
    expect(T.isAsync).toBe(true)
    expect(T.lifetime).toBe('singleton')
    expect(T.name).toBe('test/AsyncService')
  })

  it('produces independent symbols for distinct definitions sharing a name', () => {
    const A = defineServiceAsync({ name: 'test/SameName', lifetime: 'singleton', factory: async () => 1 })
    const B = defineServiceAsync({ name: 'test/SameName', lifetime: 'singleton', factory: async () => 2 })
    expect(A.id).not.toBe(B.id)
  })
})

describe('isToken', () => {
  it('returns true for a token produced by defineService', () => {
    const T = defineService({ name: 'test/Guard', lifetime: 'singleton', factory: () => 0 })
    expect(isToken(T)).toBe(true)
  })

  it('returns true for a token produced by defineServiceAsync', () => {
    const T = defineServiceAsync({ name: 'test/AsyncGuard', lifetime: 'singleton', factory: async () => 0 })
    expect(isToken(T)).toBe(true)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['number', 42],
    ['string', 'token'],
    ['boolean', true],
    ['array', [1, 2, 3]],
    ['plain object', { id: 'string-not-symbol' }],
  ])('returns false for non-token value: %s', (_label, value) => {
    expect(isToken(value)).toBe(false)
  })

  it('returns false when id is not a symbol', () => {
    expect(
      isToken({
        id: 'not-a-symbol',
        name: 'x',
        lifetime: 'singleton',
        isAsync: false,
        factory: () => null,
      }),
    ).toBe(false)
  })

  it('returns false when name is missing', () => {
    expect(
      isToken({
        id: Symbol('x'),
        lifetime: 'singleton',
        isAsync: false,
        factory: () => null,
      }),
    ).toBe(false)
  })

  it('returns false when lifetime is missing', () => {
    expect(
      isToken({
        id: Symbol('x'),
        name: 'x',
        isAsync: false,
        factory: () => null,
      }),
    ).toBe(false)
  })

  it('returns false when isAsync is not a boolean', () => {
    expect(
      isToken({
        id: Symbol('x'),
        name: 'x',
        lifetime: 'singleton',
        isAsync: 'no',
        factory: () => null,
      }),
    ).toBe(false)
  })

  it('returns false when factory is not a function', () => {
    expect(
      isToken({
        id: Symbol('x'),
        name: 'x',
        lifetime: 'singleton',
        isAsync: false,
        factory: 'callme',
      }),
    ).toBe(false)
  })
})
