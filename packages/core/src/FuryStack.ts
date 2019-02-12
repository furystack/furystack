import { Injector } from '@furystack/inject'
import { LoggerCollection } from './Loggers/LoggerCollection'
import { IFuryStackOptions } from './Models'
import { IApi } from './Models/IApi'

/**
 * Default options for a FuryStack instance
 */
export const defaultFuryStackOptions: IFuryStackOptions = {
  apis: [],
  injectorParent: Injector.Default,
}

/**
 * Main entry point for using FuryStack
 */
export class FuryStack {
  public readonly LogScope: string = '@furystack/core/' + this.constructor.name
  public readonly logger: LoggerCollection
  public readonly injector: Injector
  public readonly options: IFuryStackOptions
  public async dispose() {
    this.logger.Debug({
      scope: this.LogScope,
      message: `Disposing ${this.constructor.name}.`,
    })
    await this.apis.map(api => api.dispose())
    this.logger.Debug({
      scope: this.LogScope,
      message: `Disposing ${this.constructor.name} finished.`,
    })
  }
  public readonly apis: IApi[]
  public async start() {
    this.logger.Debug({
      scope: this.LogScope,
      message: `Starting ${this.constructor.name}.`,
    })
    await this.apis.map(api => api.activate())
    this.logger.Debug({
      scope: this.LogScope,
      message: `Starting ${this.constructor.name} finished.`,
    })
  }

  constructor(options?: Partial<IFuryStackOptions>) {
    this.options = { ...defaultFuryStackOptions, ...options }
    this.injector = new Injector({ parent: this.options.injectorParent, owner: this })
    this.logger = this.injector.GetInstance(LoggerCollection)
    this.apis = Array.from(this.options.apis).map(api => this.injector.GetInstance(api))
  }
}
