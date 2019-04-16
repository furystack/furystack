import { DefaultFilter, IPhysicalStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { ILogger, ScopedLogger } from '@furystack/logging'
import { Connection, Repository } from 'typeorm'

/**
 * TypeORM Store implementation for FuryStack
 */
export class TypeOrmStore<T> implements IPhysicalStore<T> {
  public primaryKey!: keyof T
  private typeOrmRepo!: Repository<T>

  public readonly model: Constructable<T>
  private readonly logger: ScopedLogger

  constructor(
    private readonly options: {
      model: Constructable<T>
      connection: Connection
      logger: ILogger
    },
  ) {
    this.logger = this.options.logger.withScope('@furystack/typeorm-store/' + this.constructor.name)

    this.model = options.model
    this.logger.verbose({
      message: `Initializing TypeORM Store for ${this.model.name}...`,
    })
    options.connection.awaitConnection().then(c => {
      this.typeOrmRepo = c.getRepository<T>(options.model)
      this.primaryKey = this.typeOrmRepo.metadata.primaryColumns[0].propertyName as keyof T
    })
  }
  public async add(data: T): Promise<T> {
    await this.options.connection.awaitConnection()
    return await this.typeOrmRepo.save(data)
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    await this.options.connection.awaitConnection()
    await this.typeOrmRepo.update(id, data)
  }
  public async count(): Promise<number> {
    await this.options.connection.awaitConnection()
    return await this.typeOrmRepo.count()
  }
  public async filter(filter: DefaultFilter<T>): Promise<T[]> {
    await this.options.connection.awaitConnection()
    const { top, skip, order, ...where } = filter

    return await this.typeOrmRepo.find({
      where,
      take: top,
      skip,
      order,
    })
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    await this.options.connection.awaitConnection()
    return await this.typeOrmRepo.findOne(key)
  }
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    await this.options.connection.awaitConnection()
    await this.typeOrmRepo.delete(key)
  }
  public async dispose() {
    /** */
    this.logger.information({
      message: `Disposing TypeORM Store for Entity Type ${this.model.name}`,
    })
    await this.typeOrmRepo.manager.connection.close()
  }
}
