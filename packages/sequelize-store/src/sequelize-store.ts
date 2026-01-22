import type {
  CreateResult,
  FilterType,
  FindOptions,
  PartialResult,
  PhysicalStore,
  WithOptionalId,
} from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import { Lock } from 'semaphore-async-await'
import type { FindAttributeOptions, Identifier, Model, ModelStatic, Sequelize, WhereOptions } from 'sequelize'

export interface SequelizeStoreSettings<T extends object, M extends Model<T>, TPrimaryKey extends keyof T> {
  /**
   * The Model to use
   */
  model: Constructable<T>

  /**
   * The Sequelize Model class
   */
  sequelizeModel: ModelStatic<M>
  /**
   * The Primary key field
   */
  primaryKey: TPrimaryKey
  /**
   * Callback that returns the Sequelize client (provided by the client factory)
   */
  getSequelizeClient: () => Sequelize
  /**
   * Optional callback that will initialize the Model for the Sequelize instance
   */
  initModel?: (sequelize: Sequelize) => Promise<void>
}

/**
 * Sequelize Store implementation for FuryStack
 */
export class SequelizeStore<
  T extends object,
  M extends Model<T>,
  TPrimaryKey extends keyof T,
  TWriteableData = WithOptionalId<T, TPrimaryKey>,
>
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
  }>
  implements PhysicalStore<T, TPrimaryKey, TWriteableData>
{
  public readonly primaryKey: TPrimaryKey

  public readonly model: Constructable<T>

  public readonly sequelizeModel: ModelStatic<M>

  private initLock = new Lock()

  private initializedModel?: ModelStatic<M>

  public async getModel(): Promise<ModelStatic<M>> {
    if (this.initializedModel) {
      return this.initializedModel
    }
    await this.initLock.acquire()
    if (this.initializedModel) {
      return this.initializedModel
    }
    try {
      const client = this.options.getSequelizeClient()

      if (this.options.initModel) {
        await this.options.initModel(client)
        await client.sync()
      }

      const model = client.model(this.options.sequelizeModel.name) as ModelStatic<M>

      this.initializedModel = this.sequelizeModel
      return model
    } finally {
      this.initLock.release()
    }
  }

  constructor(private readonly options: SequelizeStoreSettings<T, M, TPrimaryKey>) {
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.sequelizeModel = options.sequelizeModel
  }
  public async add(...entries: TWriteableData[]): Promise<CreateResult<T>> {
    const model = await this.getModel()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const createdModels = await model.bulkCreate(entries)

    const created = createdModels.map((c) => c.toJSON())

    created.forEach((entity) => this.emit('onEntityAdded', { entity }))
    return {
      created,
    }
  }
  public async update(id: T[TPrimaryKey], data: Partial<T>): Promise<void> {
    const model = await this.getModel()

    const result = await model.update(data, { where: { [this.primaryKey]: id } as WhereOptions<T> })
    if (result[0] < 1) {
      throw Error('Entity not found')
    }
    this.emit('onEntityUpdated', { id, change: data })
  }
  public async count(filter?: FilterType<T>): Promise<number> {
    const model = await this.getModel()
    return await model.count({ where: filter as WhereOptions<T> })
  }
  public async find<TFields extends Array<keyof T>>(
    filter: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields>>> {
    const model = await this.getModel()

    const order = filter.order
      ? [
          ...Object.keys(filter.order).map<[string, string]>((key) => [
            key,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (filter.order as any)[key] === 'ASC' ? 'ASC' : 'DESC',
          ]),
        ]
      : []

    const result = await model.findAll({
      where: filter.filter as WhereOptions<T>,
      attributes: filter.select as FindAttributeOptions,
      order,
      limit: filter.top,
      offset: filter.skip,
    })
    return result.map((r) => r.toJSON())
  }

  public async get(key: T[TPrimaryKey], select?: Array<keyof T>): Promise<T | undefined> {
    const model = await this.getModel()
    return (await model.findByPk(key as Identifier, { attributes: select as string[] }))?.toJSON()
  }
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    const model = await this.getModel()
    await model.destroy({ where: { [this.primaryKey]: keys } as WhereOptions<T> })
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }
}
