import type { InMemoryStore } from './in-memory-store.js'
import type { FilterType } from './models/physical-store.js'
import { isLogicalOperator, isOperator } from './models/physical-store.js'

type FieldOperatorFilter = {
  $eq?: unknown
  $ne?: unknown
  $in?: unknown[]
  $nin?: unknown[]
  $gt?: unknown
  $gte?: unknown
  $lt?: unknown
  $lte?: unknown
  $startsWith?: string
  $endsWith?: string
  $like?: string
  $regex?: string
}

const escapeRegexMeta = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const evaluateLike = (value: string, likeString: string) => {
  const likeRegex = `^${likeString.split('%').map(escapeRegexMeta).join('.*')}$`
  return value.match(new RegExp(likeRegex, 'i'))
}

/**
 * In-memory evaluation of a {@link FilterType} expression. Used by
 * {@link InMemoryStore.find} and any consumer that needs to filter without
 * round-tripping a real store. Throws on unknown operators (defensive — the
 * type system rejects them at compile time).
 *
 * Supported field operators: `$eq`, `$ne`, `$in`, `$nin`, `$gt`, `$gte`,
 * `$lt`, `$lte`, `$startsWith`, `$endsWith`, `$like` (`%` wildcard, case
 * insensitive), `$regex`. Logical: `$and`, `$or`.
 */
export function filterItems<T>(values: T[], filter?: FilterType<T>): T[] {
  if (!filter) {
    return values
  }
  return values.filter((item) => {
    const filterRecord = filter as Record<string, Array<FilterType<T>> | FieldOperatorFilter | undefined>
    const itemRecord = item as Record<string, unknown>

    for (const key in filterRecord) {
      if (isLogicalOperator(key)) {
        const filterValue = filterRecord[key] as Array<FilterType<T>>
        switch (key) {
          case '$and':
            if (filterValue.some((v: FilterType<T>) => !filterItems([item], v).length)) {
              return false
            }
            break
          case '$or':
            if (filterValue.some((v: FilterType<T>) => filterItems([item], v).length)) {
              break
            }
            return false
          default:
            throw new Error(`The logical operation '${key}' is not a valid operation`)
        }
      } else {
        const fieldFilter = filterRecord[key] as FieldOperatorFilter | undefined
        if (typeof fieldFilter === 'object' && fieldFilter !== null) {
          for (const filterKey in fieldFilter) {
            if (isOperator(filterKey)) {
              const itemValue = itemRecord[key]
              const filterValue = fieldFilter[filterKey as keyof FieldOperatorFilter]
              switch (filterKey) {
                case '$eq':
                  if (filterValue !== itemValue) {
                    return false
                  }
                  break
                case '$ne':
                  if (filterValue === itemValue) {
                    return false
                  }
                  break
                case '$in':
                  if (!(filterValue as unknown[]).includes(itemValue)) {
                    return false
                  }
                  break
                case '$nin':
                  if ((filterValue as unknown[]).includes(itemValue)) {
                    return false
                  }
                  break
                case '$lt':
                  if ((itemValue as number) < (filterValue as number)) {
                    break
                  }
                  return false
                case '$lte':
                  if ((itemValue as number) <= (filterValue as number)) {
                    break
                  }
                  return false
                case '$gt':
                  if ((itemValue as number) > (filterValue as number)) {
                    break
                  }
                  return false
                case '$gte':
                  if ((itemValue as number) >= (filterValue as number)) {
                    break
                  }
                  return false
                case '$regex':
                  try {
                    if (!new RegExp(filterValue as string).test(String(itemValue))) {
                      return false
                    }
                  } catch (e) {
                    throw new Error(
                      `Invalid regular expression for $regex filter on field '${key}': ${(e as Error).message}`,
                      { cause: e },
                    )
                  }
                  break
                case '$startsWith':
                  if (!(itemValue as string).startsWith(filterValue as string)) {
                    return false
                  }
                  break
                case '$endsWith':
                  if (!(itemValue as string).endsWith(filterValue as string)) {
                    return false
                  }
                  break
                case '$like':
                  if (!evaluateLike(itemValue as string, filterValue as string)) {
                    return false
                  }
                  break
                default:
                  throw new Error(`The expression (${filterKey}) is not a supported filter operation`)
              }
            } else {
              throw new Error(`The filter key '${filterKey}' is not a valid operation`)
            }
          }
        } else {
          throw new Error(`The filter has to be an object, got ${typeof fieldFilter} for field '${key}'`)
        }
      }
    }
    return true
  })
}
