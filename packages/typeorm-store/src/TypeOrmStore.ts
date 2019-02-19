import { ILogger, IPhysicalStore } from '@furystack/core'
import { Repository } from 'typeorm'

/**
 * TypeORM Store implementation for FuryStack
 */
export class TypeOrmStore<T> implements IPhysicalStore<T> {
  public primaryKey: keyof T
  constructor(public logger: ILogger, private typeOrmRepo: Repository<T>) {
    // ToDo: checkme
    this.primaryKey = this.typeOrmRepo.metadata.primaryColumns[0].propertyName as keyof T
  }
  public async add(data: T): Promise<T> {
    return await this.typeOrmRepo.save(data)
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    await this.typeOrmRepo.update(id, data)
  }
  public async count(): Promise<number> {
    return await this.typeOrmRepo.count()
  }
  public async filter(filter: Partial<T> & { top?: number | undefined; skip?: number | undefined }): Promise<T[]> {
    const { top, skip, ...where } = filter
    return await this.typeOrmRepo.find({
      where,
      take: top,
      skip,
    })
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    return await this.typeOrmRepo.findOne(key)
  }
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    await this.typeOrmRepo.delete(key)
  }
  public dispose() {
    /** */
  }
}
