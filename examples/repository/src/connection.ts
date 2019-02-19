import { join } from 'path'
import { Connection, createConnection } from 'typeorm'
import { User } from './Models/User'

/** Returns a TypeOrm store instance */

let storeInstance: Connection

/**
 * Returns the Store instance
 */
export const getConnection = async () => {
  if (!storeInstance) {
    storeInstance = await createConnection({
      type: 'sqlite',
      database: join(__dirname, 'db.sqlite'),
      logging: true,
      entities: [User],
      synchronize: true,
    })
  }
  return storeInstance
}
