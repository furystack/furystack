import { writeFileSync } from 'fs'
import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { Configuration, EntityType } from './models'

/**
 * Service class for persisting entity types
 */
@Injectable({ lifetime: 'transient' })
export class EntityTypeWriter {
  private logVerbose(message: string) {
    this.logger.verbose({
      message,
    })
  }

  private getNavigationPropertyType(entityTypeNames: string[], typeName: string) {
    if (entityTypeNames.includes(typeName)) {
      return `import('./${typeName}').${typeName}`
    }
    if (typeName.startsWith('Collection(')) {
      typeName = typeName.replace('Collection(', '').replace(')', '')
      return `Array<import('./${typeName}').${typeName}>`
    }

    return `any // Original was: '${typeName}'`
  }

  public writeEntityTypes(types: EntityType[]) {
    const typeNames = types.map(t => t.name)
    for (const entityType of types) {
      this.logVerbose(`Writing Entity Type '${entityType.name}'...`)
      let properties = ''
      if (entityType.properties) {
        for (const property of entityType.properties) {
          const propertyType = this.config.resolveEdmType(property.type)
          properties += `${this.config.entityPropertyTemplate}`
            .replace(/\$\{name\}/g, property.name)
            .replace(/\$\{type\}/g, propertyType)
            .replace(/\$\{nullable\}/g, property.nullable ? '?' : '!')
        }
      }

      let navigationProperties = ''
      if (entityType.navigationProperties) {
        for (const property of entityType.navigationProperties) {
          const propertyType = this.getNavigationPropertyType(typeNames, property.type)
          navigationProperties += this.config.entityPropertyTemplate
            .replace(/\$\{name\}/g, property.name)
            .replace(/\$\{type\}/g, propertyType)
            .replace(/\$\{nullable\}/g, property.nullable ? '?' : '!')
        }
      }

      const output = `${this.config.entityTypeTemplate
        .replace(/\$\{name\}/g, entityType.name)
        .replace(/\$\{properties\}/g, properties)
        .replace(/\$\{navigationProperties\}/g, navigationProperties)
        .replace(/\$\{key\}/g, entityType.key)}`
      writeFileSync(
        join(
          process.cwd(),
          this.config.outputPath,
          this.config.entityTypePath,
          `${this.config.getModelFileName(entityType.name)}.ts`,
        ),
        output,
      )
    }

    this.logVerbose('Writing barrel file...')
    writeFileSync(
      join(process.cwd(), this.config.outputPath, this.config.entityTypePath, `index.ts`),
      types.map(t => `export * from "./${this.config.getModelFileName(t.name)}";\r\n`).join(''),
    )
  }

  private logger: ScopedLogger

  constructor(private injector: Injector, private readonly config: Configuration) {
    this.logger = this.injector.logger.withScope(`@furystack/odata-fetchr/${this.constructor.name}`)
    this.logVerbose('Starting EntityTypeWriter...')
  }
}
