import { IPhysicalStore, StoreManager } from '@furystack/core'
import { HttpAuthenticationSettings } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { Task } from './Models/Task'
import { TestEntry } from './Models/TestEntry'
import { User } from './Models/User'

/**
 * gets an existing instance if exists or create and return if not. Throws error on multiple result
 * @param filter The filter term
 * @param instance The instance to be created if there is no instance present
 * @param store The physical store to use
 */
export const getOrCreate = async <T>(filter: Partial<T>, instance: T, store: IPhysicalStore<T>, injector: Injector) => {
  const result = await store.filter(filter)
  const logger = injector.logger.withScope('Seeder')
  if (result.length === 1) {
    return result[0]
  } else if (result.length === 0) {
    logger.verbose({
      message: `Entity of type '${store.constructor.name}' not exists, adding: '${JSON.stringify(filter)}'`,
    })
    return await store.add(instance)
  } else {
    const message = `Seed filter contains multiple results`
    logger.warning({ message })
    throw Error(message)
  }
}

/**
 * Seeds the databases with predefined values
 * @param injector The injector instance
 */
export const seed = async (injector: Injector) => {
  const logger = injector.logger.withScope('seeder')
  logger.verbose({ message: 'Seeding data...' })
  const sm = injector.getInstance(StoreManager)
  const userStore = sm.getStoreFor(User)
  const testUser = await getOrCreate(
    { username: 'testuser' },
    {
      username: 'testuser',
      password: injector.getInstance(HttpAuthenticationSettings).hashMethod('password'),
      roles: [],
    },
    userStore,
    injector,
  )

  const taskStore = sm.getStoreFor(Task)

  await getOrCreate(
    {
      name: 'testTask',
    },
    {
      id: undefined,
      name: 'testTask',
      userId: testUser.id as string,
      completed: false,
    },
    taskStore,
    injector,
  )

  const testEntryStore = sm.getStoreFor(TestEntry)
  await getOrCreate({ id: 1 }, { id: 1, value: 'testEntry1' }, testEntryStore, injector)
  await getOrCreate({ id: 2 }, { id: 2, value: 'testEntry1' }, testEntryStore, injector)

  logger.verbose({ message: 'Seeding data completed.' })
}
