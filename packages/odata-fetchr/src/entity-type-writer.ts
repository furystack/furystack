import { Injectable, Injector } from '@furystack/inject'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { Configuration, EntityType } from './models'

/**
 * Service class for persisting entity types
 */
@Injectable({ lifetime: 'transient' })
export class EntityTypeWriter {
  private logVerbose(message: string) {
    this.injector.logger.verbose({
      message,
      scope: `@furystack/odata-fetchr/${this.constructor.name}`,
    })
  }

  public writeEntityTypes(types: EntityType[]) {
    for (const entityType of types) {
      this.logVerbose(`Writing Entity Type '${entityType.name}'...`)
      let properties = ''
      if (entityType.properties) {
        for (const property of entityType.properties) {
          const propertyType = this.config.resolveEdmType(property.type)
          properties += ('' + this.config.entityPropertyTemplate)
            .replace(/\$\{name\}/g, property.name)
            .replace(/\$\{type\}/g, propertyType)
            .replace(/\$\{nullable\}/g, property.nullable ? '?' : '!')
        }
      }

      const output =
        '' +
        this.config.entityTypeTemplate.replace(/\$\{name\}/g, entityType.name).replace(/\$\{properties\}/g, properties)
      writeFileSync(join(process.cwd(), this.config.outputPath, 'entity-types', `${entityType.name}.ts`), output)
    }
  }

  constructor(private injector: Injector, private readonly config: Configuration) {
    this.logVerbose('Starting EntityTypeWriter...')
  }
}
