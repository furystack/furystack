import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { Configuration, EntitySet } from './models'

/**
 * Service class for persisting entity types
 */
@Injectable({ lifetime: 'transient' })
export class EntityCollectionWriter {
  public writeEntityCollections(collections: EntitySet[]) {
    for (const collection of collections) {
      this.logger.verbose({ message: `Writing EntitySet '${collection.name}'...` })

      const output =
        '' +
        this.config.odataCollectionServiceTemplate
          .replace(/\$\{entitySet\}/g, collection.name)
          .replace(/\$\{entitySetModel\}/g, collection.entityType)
      writeFileSync(
        join(process.cwd(), this.config.outputPath, this.config.entityCollectionServicesPath, `${collection.name}.ts`),
        output,
      )
    }

    this.logger.verbose({ message: 'Writing barrel file...' })
    writeFileSync(
      join(process.cwd(), this.config.outputPath, this.config.entityCollectionServicesPath, `index.ts`),
      collections.map(t => `export * from './${t.name}'\r\n`).join(''),
    )
  }

  private logger: ScopedLogger

  constructor(private injector: Injector, private readonly config: Configuration) {
    this.logger = this.injector.logger.withScope('@furystack/odata-fetchr/' + this.constructor.name)
    this.logger.verbose({ message: 'Starting EntityTypeWriter...' })
  }
}
