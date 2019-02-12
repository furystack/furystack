import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { Repository } from '../Repository'

/**
 * HTTP Action for finding content
 */
@Injectable()
export class FindContent implements IRequestAction {
  public dispose() {
    /**  */
  }
  public async exec(): Promise<void> {
    const parsedUrl = parse(this.incomingMessage.url as string, true)
    const data = JSON.parse(parsedUrl.query.data as string)
    const aspectName = parsedUrl.query.aspectName as string
    const content = await this.repository.Find({
      data,
      aspectName,
    })
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify(content))
  }
  /**
   *
   */
  constructor(
    private serverResponse: ServerResponse,
    private incomingMessage: IncomingMessage,
    private repository: Repository,
  ) {}
}
