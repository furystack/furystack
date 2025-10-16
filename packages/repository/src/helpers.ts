import type { Constructable, Injector } from '@furystack/inject'
import { Repository } from './repository.js'

/**
 * Returns a Repository on an injector
 * @param injector The Injector instance
 * @returns The Repository instance
 */
export const getRepository = (injector: Injector) => injector.getInstance(Repository)

/**
 * Gets a DataSet for a specific model from the repository
 * @param injector The Injector instance
 * @param model The Model
 * @param primaryKey The Primary Key field
 * @returns A Repository DataSet for a specific model
 */
export const getDataSetFor = <T, TPrimaryKey extends keyof T>(
  injector: Injector,
  model: Constructable<T>,
  primaryKey: TPrimaryKey,
) => injector.getInstance(Repository).getDataSetFor(model, primaryKey)
