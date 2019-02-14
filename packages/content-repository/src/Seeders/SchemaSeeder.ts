import { LoggerCollection } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { DeepPartial, EntityManager, FindOneOptions } from 'typeorm'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { ElevatedRepository } from '../ElevatedRepository'
import { ContentType } from '../models'

/**
 * Defines a seed entry
 */
export interface ISeedEntry<T> {
  model: Constructable<T>
  findOption: FindOneOptions<T>
  instance: DeepPartial<T>
}

/**
 * Class for populating a database schema
 */
@Injectable()
export class SchemaSeeder {
  public readonly logScope = '@furystack/content-repository/seeder'
  private get logger(): LoggerCollection {
    return this.injector.getInstance(LoggerCollection)
  }

  private async update<T>(entry: ISeedEntry<T>, manager: EntityManager) {
    const found = await manager.findOne(entry.model, entry.findOption)
    if (!found) {
      this.logger.debug({
        scope: this.logScope,
        message: `Entity '${JSON.stringify(entry.findOption)}' not found, creating...`,
        data: { instance: entry.instance },
      })
      const created = await manager.create(entry.model, entry.instance)
      return await manager.save(created)
    } else {
      Object.assign(found, entry.instance)
      return await manager.save(found)
    }
  }

  constructor(private readonly repository: ElevatedRepository, private readonly injector: Injector) {}

  public async seedBuiltinEntries() {
    await this.repository.activate()
    const log = <T>(message: string, data?: T) =>
      this.logger.debug({
        scope: this.logScope,
        message,
        data,
      })

    const store = Injector.default.getInstance(ContentDescriptorStore)
    const manager = this.repository.getManager()
    log('Seeding built-in entries...')

    await manager.transaction(async tm => {
      const cts = store.contentTypeDescriptors.entries()
      for (const [, contentType] of cts) {
        await this.update(
          {
            model: ContentType,
            findOption: {
              where: {
                Name: contentType.name,
              },
            },
            instance: contentType,
          },
          tm,
        )
      }
    })
  }
}
