import { FindOptions, PhysicalStore, PartialResult, FilterType, WithOptionalId, CreateResult } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { Sequelize, ModelStatic, Model, WhereOptions, Attributes } from 'sequelize'
import Semaphore from 'semaphore-async-await'
import { HealthCheckable, HealthCheckResult } from '@furystack/utils'

export interface SequelizeStoreSettings<T extends Model, TPrimaryKey extends keyof T> {
  /**
   * The Sequelize Model class
   */
  model: ModelStatic<T> & Constructable<T>
  /**
   * The Primary key field
   */
  primaryKey: TPrimaryKey
  /**
   * Callback that returns the Sequelize client (provided by the client factory)
   */
  getSequelizeClient: () => Promise<Sequelize>
  /**
   * Optional calback that will initialize the Model for the Sequelize instance
   */
  initModel?: (sequelize: Sequelize, injector: Injector) => Promise<void>
}

/**
 * TypeORM Store implementation for FuryStack
 */
export class SequelizeStore<T extends Model, TPrimaryKey extends keyof T>
  implements PhysicalStore<T, TPrimaryKey>, HealthCheckable
{
  public readonly primaryKey: TPrimaryKey
  private readonly injector: Injector

  public readonly model: ModelStatic<T> & Constructable<T>

  private initLock = new Semaphore(1)

  private initializedModel?: ModelStatic<T>

  public async getModel(): Promise<ModelStatic<T>> {
    if (this.initializedModel) {
      return this.initializedModel
    }
    await this.initLock.acquire()
    if (this.initializedModel) {
      return this.initializedModel
    }
    try {
      const client = await this.options.getSequelizeClient()

      if (this.options.initModel) {
        await this.options.initModel(client, this.injector)
        await client.sync()
      }

      const model = client.model(this.options.model.name) as ModelStatic<T> | undefined

      if (!model) {
        throw Error(`'No initialized Sequelize model found for '${this.options.model.name}'`)
      }

      this.initializedModel = model
      return model
    } finally {
      this.initLock.release()
    }
  }

  constructor(private readonly options: SequelizeStoreSettings<T, TPrimaryKey>, injector: Injector) {
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.injector = injector.createChild({ owner: this })
  }
  public async checkHealth(): Promise<HealthCheckResult> {
    try {
      await this.getModel()
      return {
        healthy: 'healthy',
      }
    } catch (error) {
      return {
        healthy: 'unhealthy',
        reason: {
          message: (error as Error).toString(),
        },
      }
    }
  }
  public async add(...entries: Array<WithOptionalId<T, TPrimaryKey>>): Promise<CreateResult<T>> {
    const model = await this.getModel()
    const created = await model.bulkCreate(entries as any)
    return {
      created: created.map((c) => c.toJSON() as T),
    }
  }
  public async update(id: T[TPrimaryKey], data: Partial<T>): Promise<void> {
    const model = await this.getModel()

    const result = await model.update(data, { where: { [this.primaryKey]: id } as any })
    if (result[0] < 1) {
      throw Error('Entity not found')
    }
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
            (filter.order as any)[key] === 'ASC' ? 'ASC' : 'DESC',
          ]),
        ]
      : []

    const result = await model.findAll({
      where: filter.filter as WhereOptions<T>,
      attributes: filter.select as Attributes<T>,
      order,
      limit: filter.top,
      offset: filter.skip,
    })
    return result.map((r) => r.toJSON() as T)
  }

  public async get(key: T[TPrimaryKey], select?: Array<keyof T>): Promise<T | undefined> {
    const model = await this.getModel()
    return (await (await model.findByPk(key as any, { attributes: select } as any))?.toJSON()) as T
  }
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    const model = await this.getModel()
    await model.destroy({ where: { [this.primaryKey]: keys } } as any)
  }
  public async dispose() {
    /** */
  }
}
