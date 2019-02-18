import { Injectable, Injector } from '@furystack/inject'
import { LoggerCollection } from './Loggers/LoggerCollection'
import { IApi } from './Models/IApi'
import { IFuryStackOptions } from './Models/IFuryStackOptions'

/**
 * Main entry point for using FuryStack
 */
@Injectable()
export class FuryStack {
  public readonly logScope: string = '@furystack/core/' + this.constructor.name
  public readonly logger: LoggerCollection
  public readonly injector: Injector

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
  public apis: IApi[] = []
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

  private settings: IFuryStackOptions = {
    apis: [],
  }

  public setup(settings?: Partial<IFuryStackOptions>) {
    this.settings = { ...this.settings, ...settings }
    this.apis = Array.from(this.settings.apis).map(api => this.injector.getInstance(api))
  }

  constructor(parentInjector: Injector) {
    this.injector = parentInjector.createChild({ owner: this })
    this.logger = this.injector.getInstance(LoggerCollection)
  }
}
