import type {
  FindOptions,
  PhysicalStore,
  PartialResult,
  FilterType,
  WithOptionalId,
  CreateResult,
} from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import type { Sequelize, ModelStatic, Model, WhereOptions, Attributes } from 'sequelize'
import Semaphore from 'semaphore-async-await'

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
   * Optional calback that will initialize the Model for the Sequelize instance
   */
  initModel?: (sequelize: Sequelize) => Promise<void>
}

/**
 * TypeORM Store implementation for FuryStack
 */
export class SequelizeStore<
  T extends object,
  M extends Model<T>,
  TPrimaryKey extends keyof T,
  TWriteableData = WithOptionalId<T, TPrimaryKey>,
> implements PhysicalStore<T, TPrimaryKey, TWriteableData>
{
  public readonly primaryKey: TPrimaryKey

  public readonly model: Constructable<T>

  public readonly sequelizeModel: ModelStatic<M>

  private initLock = new Semaphore(1)

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
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.sequelizeModel = options.sequelizeModel
  }
  public async add(...entries: TWriteableData[]): Promise<CreateResult<T>> {
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
      attributes: filter.select as Attributes<any>,
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
