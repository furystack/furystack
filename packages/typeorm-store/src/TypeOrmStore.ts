import { ILogger, IPhysicalStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Connection, Repository } from 'typeorm'

/**
 * TypeORM Store implementation for FuryStack
 */
export class TypeOrmStore<T> implements IPhysicalStore<T> {
  public primaryKey!: keyof T
  private typeOrmRepo!: Repository<T>
  constructor(model: Constructable<T>, private readonly connection: Connection, public logger: ILogger) {
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
  public async filter(filter: Partial<T> & { top?: number | undefined; skip?: number | undefined }): Promise<T[]> {
    await this.connection.awaitConnection()
    const { top, skip, ...where } = filter
    return await this.typeOrmRepo.find({
      where,
      take: top,
      skip,
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
  public dispose() {
    /** */
  }
}
