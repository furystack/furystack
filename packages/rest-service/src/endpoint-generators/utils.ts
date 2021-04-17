import { Injector } from '@furystack/inject'
import { InMemoryStore, User } from '@furystack/core'
import { DefaultSession } from '../models/default-session'
import '@furystack/repository'
import '../injector-extensions'

export class MockClass {
  id!: string
  value!: string
}

export const setupContext = (i: Injector) => {
  i.setupStores((b) =>
    b
      .addStore(
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
      ),
  ).setupRepository((r) => r.createDataSet(MockClass, 'id'))
}
