import { writeFileSync } from 'fs'
import { join } from 'path'
import { Configuration, EntitySet, OdataEndpoint, OdataParameter } from './models'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { terminal } from 'terminal-kit'

/**
 * Service class for persisting entity types
 */
@Injectable({ lifetime: 'transient' })
export class EntityCollectionWriter {
  private getParameterObject(params?: OdataParameter[]) {
    const filtered = params && params.filter(p => !p.name.toLowerCase().startsWith('bindingparameter'))
    return filtered && filtered.length
      ? `params: {${filtered.map(p => `${p.name}: ${this.config.resolveEdmType(p.type)}`).join(', ')}}`
      : ''
  }

  private getEntityActions(collection: EntitySet, endpoint: OdataEndpoint, primaryKeyType: string) {
    const actions = endpoint.actions
      .filter(
        action =>
          action.parameters &&
          action.parameters.find(param => param.name === 'bindingParameter' && param.type === collection.entityType),
      )
      .map(a => {
        const paramsWithType = this.getParameterObject(a.parameters)
        return this.config.customActionTemplate
          .replace(/\$\{customActionName\}/g, a.name)
          .replace(/\$\{entityIdType\}/g, primaryKeyType)
          .replace(/\$\{paramsWithType\}/g, paramsWithType)
          .replace(/\$\{params\}/g, paramsWithType ? ', params' : '')
          .replace(/\$\{returnType\}/g, a.returnType ? `<${this.config.getModelName(a.returnType)}>` : '')
      })
      .join('\r\n')
    return `${actions}`
  }

  private getEntityFunctions(collection: EntitySet, endpoint: OdataEndpoint, primaryKeyType: string) {
    const actions = endpoint.functions
      .filter(
        action =>
          action.parameters &&
          action.parameters.find(param => param.name === 'bindingParameter' && param.type === collection.entityType),
      )
      .map(a =>
        this.config.customFunctionTempalte
          .replace(/\$\{customActionName\}/g, a.name)
          .replace(/\$\{entityIdType\}/g, primaryKeyType)
          .replace(/\$\{returnType\}/g, a.returnType ? `<${this.config.getModelName(a.returnType)}>` : ''),
      )
      .join('\r\n')
    return `${actions}`
  }

  private getCollectionActions(collection: EntitySet, endpoint: OdataEndpoint, primaryKeyType: string) {
    const actions = endpoint.actions
      .filter(
        action =>
          action.parameters &&
          action.parameters.find(
            param => param.name === 'bindingParameter' && param.type === `Collection(${collection.entityType})`,
          ),
      )
      .map(a => {
        const paramsWithType = this.getParameterObject(a.parameters)
        return this.config.customCollectionActionsTemplate
          .replace(/\$\{customActionName\}/g, a.name)
          .replace(/\$\{entityIdType\}/g, primaryKeyType)
          .replace(/\$\{paramsWithType\}/g, paramsWithType)
          .replace(/\$\{params\}/g, paramsWithType ? ', params' : '')
          .replace(/\$\{returnType\}/g, a.returnType ? `<${this.config.getModelName(a.returnType)}>` : '')
      })
      .join('\r\n')
    return `${actions}`
  }

  private getCollectionFunctions(collection: EntitySet, endpoint: OdataEndpoint, primaryKeyType: string) {
    const actions = endpoint.functions
      .filter(
        action =>
          action.parameters &&
          action.parameters.find(
            param => param.name === 'bindingParameter' && param.type === `Collection(${collection.entityType})`,
          ),
      )
      .map(a =>
        this.config.customCollectionFunctionTemplate
          .replace(/\$\{customActionName\}/g, a.name)
          .replace(/\$\{entityIdType\}/g, primaryKeyType)
          .replace(/\$\{returnType\}/g, a.returnType ? `<${this.config.getModelName(a.returnType)}>` : ''),
      )
      .join('\r\n')
    return `${actions}`
  }

  public writeEntityCollections(endpoint: OdataEndpoint) {
    const progressBar = terminal.progressBar({
      title: 'Writing Collections...',
      percent: true,
      eta: true,
      items: endpoint.entitySets.length,
    })

    for (const collection of endpoint.entitySets) {
      this.logger.verbose({ message: `Writing EntitySet '${collection.name}'...` })
      const entityType = endpoint.entityTypes.find(entity => entity.name === collection.entityType)
      const primaryKeyProp =
        entityType && entityType.properties && entityType.properties.find(prop => prop.name === entityType.key)
      const primaryKeyType = primaryKeyProp && primaryKeyProp.type === 'EdmType.String' ? 'string' : 'number'
      const output = `${this.config.odataCollectionServiceTemplate
        .replace(/\$\{collectionServiceClassName\}/g, this.config.getServiceClassName(collection.name))
        .replace(/\$\{entitySetModelFile\}/g, this.config.getModelFileName(collection.entityType))
        .replace(/\$\{entitySetModelName\}/g, this.config.getModelName(collection.entityType))
        .replace(/\$\{entitySetName\}/g, collection.name)
        .replace(/\$\{customActions\}/g, this.getEntityActions(collection, endpoint, primaryKeyType))
        .replace(/\$\{customFunctions\}/g, this.getEntityFunctions(collection, endpoint, primaryKeyType))
        .replace(/\$\{customCollectionActions\}/g, this.getCollectionActions(collection, endpoint, primaryKeyType))
        .replace(/\$\{customCollectionFunctions\}/g, this.getCollectionFunctions(collection, endpoint, primaryKeyType))}

        `
      writeFileSync(
        join(
          process.cwd(),
          this.config.outputPath,
          this.config.entityCollectionServicesPath,
          `${this.config.getServiceFileName(collection.name)}.ts`,
        ),
        output,
      )
      progressBar.itemDone(collection.name)
    }

    this.logger.verbose({ message: 'Writing barrel file...' })
    writeFileSync(
      join(process.cwd(), this.config.outputPath, this.config.entityCollectionServicesPath, `index.ts`),
      endpoint.entitySets.map(t => `export * from "./${this.config.getServiceFileName(t.name)}";\r\n`).join(''),
    )
  }

  private logger: ScopedLogger

  constructor(private injector: Injector, private readonly config: Configuration) {
    this.logger = this.injector.logger.withScope(`@furystack/odata-fetchr/${this.constructor.name}`)
    this.logger.verbose({ message: 'Starting EntityTypeWriter...' })
  }
}
