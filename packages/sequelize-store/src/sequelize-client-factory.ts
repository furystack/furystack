import { Disposable } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { Sequelize, Options, Op } from 'sequelize'

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
 * Factory for instantiating Sequelize clients
 */
@Injectable({ lifetime: 'singleton' })
export class SequelizeClientFactory implements Disposable {
  private connections: Map<string, Sequelize> = new Map()

  public async dispose() {
    await Promise.all([...this.connections.values()].map((c) => c.close()))
    this.connections.clear()
  }

  public getSequelizeClient(options: Options) {
    const key = JSON.stringify(options)
    const existing = this.connections.get(key)
    if (existing) {
      return existing
    }

    const client = new Sequelize({ ...options, operatorsAliases })
    this.connections.set(key, client)
    return client
  }
}
