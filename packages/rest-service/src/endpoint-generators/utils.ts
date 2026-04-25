import { defineStore, InMemoryStore, User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet } from '@furystack/repository'
import { DefaultSession } from '../models/default-session.js'
import { SessionStore, UserStore } from '../user-store.js'

/**
 * Mock entity used by endpoint-generator specs.
 */
export class MockClass {
  declare id: string
  declare value: string
}

/**
 * Store token for {@link MockClass}. The default factory throws so each spec
 * explicitly opts into an in-memory backing via `setupContext`.
 */
export const MockStore = defineStore({
  name: 'test/MockStore',
  model: MockClass,
  primaryKey: 'id',
  factory: () => {
    throw new Error('MockStore is not configured in this injector')
  },
})

/**
 * Data set token over {@link MockStore}.
 */
export const MockDataSet = defineDataSet({
  name: 'test/MockDataSet',
  store: MockStore,
})

/**
 * Binds in-memory implementations of {@link UserStore}, {@link SessionStore}
 * and {@link MockStore} on the provided injector. Endpoint-generator specs
 * and integration tests call this at setup time.
 */
export const setupContext = (i: Injector): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(MockStore, () => new InMemoryStore({ model: MockClass, primaryKey: 'id' }))
}
