import { PhysicalStore, StoreManager, SearchOptions } from '@furystack/core'
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
export const getOrCreate = async <T>(
  filter: SearchOptions<T, Array<keyof T>>,
  instance: T,
  store: PhysicalStore<T>,
  injector: Injector,
) => {
  const result = await store.search(filter)
  const logger = injector.logger.withScope('Seeder')
  if (result.length === 1) {
    return result[0]
  } else if (result.length === 0) {
    logger.verbose({
      message: `Entity of type '${store.constructor.name}' not exists, adding: '${JSON.stringify(filter)}'`,
    })
    return await store.add(instance)
  } else {
    const message = `Seed filter contains '${result.length}' results for ${JSON.stringify(filter)}`
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
    { filter: { username: 'testuser' } },
    {
      username: 'testuser',
      password: injector.getInstance(HttpAuthenticationSettings).hashMethod('password'),
      roles: [],
    } as any,
    userStore,
    injector,
  )

  const taskStore = sm.getStoreFor(Task)

  await getOrCreate(
    {
      filter: {
        name: 'testTask',
      },
    },
    {
      _id: 'undefined',
      name: 'testTask',
      userId: testUser.id as string,
      completed: false,
    },
    taskStore,
    injector,
  )

  const testEntryStore = sm.getStoreFor(TestEntry)
  await getOrCreate({ filter: { _id: '1' } }, { _id: '1', value: 'testEntry1' }, testEntryStore, injector)
  await getOrCreate({ filter: { _id: '2' } }, { _id: '2', value: 'testEntry1' }, testEntryStore, injector)

  logger.verbose({ message: 'Seeding data completed.' })
}
