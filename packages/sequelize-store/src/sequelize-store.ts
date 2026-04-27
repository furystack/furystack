import type {
  Constructable,
  CreateResult,
  FilterType,
  FindOptions,
  PartialResult,
  PhysicalStore,
  WithOptionalId,
} from '@furystack/core'
import { EventHub } from '@furystack/utils'
import type { FindAttributeOptions, Identifier, Model, ModelStatic, Sequelize, WhereOptions } from 'sequelize'
import type { SequelizeClientFactory } from './sequelize-client-factory.js'

export interface SequelizeStoreSettings<T extends object, M extends Model<T>, TPrimaryKey extends keyof T> {
  model: Constructable<T>
  sequelizeModel: ModelStatic<M>
  primaryKey: TPrimaryKey
  /** Resolves the pooled Sequelize client (typically delegated to {@link SequelizeClientFactory}). */
  getSequelizeClient: () => Sequelize
  /** Runs once before the first DB call (e.g. `Model.init(...)` + `sequelize.sync()`). */
  initModel?: (sequelize: Sequelize) => Promise<void>
}

/**
 * {@link PhysicalStore} backed by a Sequelize Model.
 *
 * The Sequelize client is resolved lazily on the first DB call via
 * {@link getModel}. {@link SequelizeStoreSettings.initModel} runs once and is
 * memoized; if it throws the cached promise is cleared so the next call retries.
 *
 * The store has no `[Symbol.asyncDispose]` — client lifetime belongs to
 * {@link SequelizeClientFactory}, which closes pooled clients on injector
 * teardown.
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

  private initPromise: Promise<ModelStatic<M>> | null = null

  private initializedModel?: ModelStatic<M>

  public async getModel(): Promise<ModelStatic<M>> {
    if (this.initializedModel) {
      return this.initializedModel
    }
    if (!this.initPromise) {
      this.initPromise = this.initializeModel()
    }
    return this.initPromise
  }

  private async initializeModel(): Promise<ModelStatic<M>> {
    try {
      const client = this.options.getSequelizeClient()

      if (this.options.initModel) {
        await this.options.initModel(client)
        await client.sync()
      }

      const model = client.model(this.options.sequelizeModel.name) as ModelStatic<M>

      this.initializedModel = model
      return model
    } catch (error) {
      this.initPromise = null
      throw error
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
