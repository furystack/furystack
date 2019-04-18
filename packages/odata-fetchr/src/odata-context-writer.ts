import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { Configuration, OdataEndpoint } from './models'

/**
 * OData Context Writer class
 */
@Injectable({ lifetime: 'transient' })
export class OdataContextWriter {
  public logger: ScopedLogger
  public async writeContext(endpoint: OdataEndpoint) {
    const output = this.config.odataContextTemplate
      .replace('${odataRootPath}', endpoint.path)
      .replace('${creationDate}', new Date().toISOString())
    writeFileSync(join(process.cwd(), this.config.outputPath, `odata-context.ts`), output)
  }

  constructor(private injector: Injector, private readonly config: Configuration) {
    this.logger = this.injector.logger.withScope('@furystack/odata-fetchr/' + this.constructor.name)
    this.logger.verbose({ message: 'Starting Odata Context Writer...' })
  }
}
