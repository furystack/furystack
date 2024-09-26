import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { Injector } from './injector.js'
import { getInjectorReference, withInjectorReference } from './with-injector-reference.js'

describe('withInjectorReference', () => {
  it('Should return the injector reference when the instance has it', async () => {
    await usingAsync(new Injector(), async (i) => {
      const instance = withInjectorReference({}, i)
      expect(getInjectorReference(instance)).toBe(i)
    })
  })

  it('Should throw an error when the instance does not have the injector reference', () => {
    expect(() => getInjectorReference({})).toThrowError('The instance does not have an injector reference')
  })
})
