import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { Options } from 'sequelize'
import { Op, Sequelize } from 'sequelize'

const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $nin: Op.notIn,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regex: Op.regexp,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $startsWith: Op.startsWith,
  $endsWith: Op.endsWith,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
}

/**
 * Pools {@link Sequelize} client instances keyed by the serialized options so
 * multiple stores against the same connection string share one client.
 */
export interface SequelizeClientFactory {
  getSequelizeClient(options: Options): Sequelize
}

/**
 * Singleton token for the {@link SequelizeClientFactory}. Closes every pooled
 * client when the owning injector is disposed.
 */
export const SequelizeClientFactory: Token<SequelizeClientFactory, 'singleton'> = defineService({
  name: '@furystack/sequelize-store/SequelizeClientFactory',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const connections = new Map<string, Sequelize>()
    onDispose(async () => {
      await Promise.all([...connections.values()].map((c) => c.close()))
      connections.clear()
    })
    return {
      getSequelizeClient(options: Options): Sequelize {
        const key = JSON.stringify(options)
        const existing = connections.get(key)
        if (existing) {
          return existing
        }
        const client = new Sequelize({ ...options, operatorsAliases })
        connections.set(key, client)
        return client
      },
    }
  },
})
