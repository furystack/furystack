import type { Injector } from '@furystack/inject'
import { addStore, InMemoryStore, User } from '@furystack/core'
import { DefaultSession } from '../models/default-session.js'
import '@furystack/repository'
import '../helpers.js'
import { getRepository } from '@furystack/repository'

export class MockClass {
  id!: string
  value!: string
}

export const setupContext = (i: Injector) => {
  addStore(
    i,
    new InMemoryStore({
      model: MockClass,
      primaryKey: 'id',
    }),
  )
    .addStore(
      new InMemoryStore({
        model: User,
        primaryKey: 'username',
      }),
    )
    .addStore(
      new InMemoryStore({
        model: DefaultSession,
        primaryKey: 'sessionId',
      }),
    )
  getRepository(i).createDataSet(MockClass, 'id')
}
