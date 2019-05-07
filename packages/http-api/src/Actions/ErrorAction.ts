import { Injectable } from '@furystack/inject'
import { LoggerCollection, ScopedLogger } from '@furystack/logging'
import { IncomingMessage, ServerResponse } from 'http'
import { IRequestAction } from '../Models'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */
@Injectable({ lifetime: 'transient' })
export class ErrorAction implements IRequestAction {
  public dispose() {
    /** */
  }
  public async exec(): Promise<void> {
    throw new Error('Invalid Error action call.')
  }
  public async returnError(error: any): Promise<void> {
    this.serverResponse.writeHead(500, 'Server error', { 'Content-Type': 'application/json' })
    this.serverResponse.end(
      JSON.stringify({ message: error.message, url: this.incomingMessage.url, stack: error.stack }),
    )
    this.logger.warning({
      message: `An action returned 500 from '${this.incomingMessage.url}'.`,
      data: {
        error,
      },
    })
  }

  private readonly logger: ScopedLogger

  constructor(
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
    logger: LoggerCollection,
  ) {
    this.logger = logger.withScope('@furystack/http-api/' + this.constructor.name)
  }
}
