import { DefaultFilter, IPhysicalStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { ILogger } from '@furystack/logging'
import { Connection, Repository } from 'typeorm'

/**
 * TypeORM Store implementation for FuryStack
 */
export class TypeOrmStore<T> implements IPhysicalStore<T> {
  public primaryKey!: keyof T
  private typeOrmRepo!: Repository<T>
  constructor(
    private readonly model: Constructable<T>,
    private readonly connection: Connection,
    public logger: ILogger,
  ) {
    this.logger.verbose({
      scope: '@furystack/typeorm-store/TypeOrmStore',
      message: `Initializing TypeORM Store for ${model.name}...`,
    })
    connection.awaitConnection().then(c => {
      this.typeOrmRepo = c.getRepository<T>(model)
      this.primaryKey = this.typeOrmRepo.metadata.primaryColumns[0].propertyName as keyof T
    })
  }
  public async add(data: T): Promise<T> {
    await this.connection.awaitConnection()
    return await this.typeOrmRepo.save(data)
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    await this.connection.awaitConnection()
    await this.typeOrmRepo.update(id, data)
  }
  public async count(): Promise<number> {
    await this.connection.awaitConnection()
    return await this.typeOrmRepo.count()
  }
  public async filter(filter: DefaultFilter<T>): Promise<T[]> {
    await this.connection.awaitConnection()
    const { top, skip, order, ...where } = filter

    return await this.typeOrmRepo.find({
      where,
      take: top,
      skip,
      order,
    })
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    await this.connection.awaitConnection()
    return await this.typeOrmRepo.findOne(key)
  }
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    await this.connection.awaitConnection()
    await this.typeOrmRepo.delete(key)
  }
  public async dispose() {
    /** */
    this.logger.information({
      scope: '@furystack/typeorm-store/TypeOrmStore',
      message: `Disposing TypeORM Store for Entity Type ${this.model.name}`,
    })
    await this.typeOrmRepo.manager.connection.close()
  }
}
