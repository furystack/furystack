import { Injector } from '@furystack/inject'
import { LoggerCollection } from './Loggers/LoggerCollection'
import { IApi } from './Models/IApi'
import { IFuryStackOptions } from './Models/IFuryStackOptions'

/**
 * Default options for a FuryStack instance
 */
export const defaultFuryStackOptions: IFuryStackOptions = {
  apis: [],
  injectorParent: Injector.default,
}

/**
 * Main entry point for using FuryStack
 */
export class FuryStack {
  public readonly logScope: string = '@furystack/core/' + this.constructor.name
  public readonly logger: LoggerCollection
  public readonly injector: Injector
  public readonly options: IFuryStackOptions
  public async dispose() {
    this.logger.debug({
      scope: this.logScope,
      message: `Disposing ${this.constructor.name}.`,
    })
    await this.apis.map(api => api.dispose())
    this.logger.debug({
      scope: this.logScope,
      message: `Disposing ${this.constructor.name} finished.`,
    })
  }
  public readonly apis: IApi[]
  public async start() {
    this.logger.debug({
      scope: this.logScope,
      message: `Starting ${this.constructor.name}.`,
    })
    await this.apis.map(api => api.activate())
    this.logger.debug({
      scope: this.logScope,
      message: `Starting ${this.constructor.name} finished.`,
    })
  }

  constructor(options?: Partial<IFuryStackOptions>) {
    this.options = { ...defaultFuryStackOptions, ...options }
    this.injector = new Injector({ parent: this.options.injectorParent, owner: this })
    this.logger = this.injector.getInstance(LoggerCollection)
    this.apis = Array.from(this.options.apis).map(api => this.injector.getInstance(api))
  }
}
