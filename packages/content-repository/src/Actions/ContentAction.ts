import { IRequestAction, Utils } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { ISavedContent } from '../models/Content'
import { Repository } from '../Repository'

/**
 * HTTP Action implementation for Content CRUD
 */
@Injectable()
export class ContentAction implements IRequestAction {
  public dispose() {
    /**  */
  }

  private async getContent() {
    const parsedUrl = parse(this.incomingMessage.url as string, true)
    const contentId = parseInt(parsedUrl.query.contentId as string, 10)
    const aspectName = (parsedUrl.query.aspectName as string) || 'Details'
    // tslint:disable-next-line: naming-convention
    const { fields, contentTypeRef, ...content } = (await this.repository.load({
      ids: [contentId],
      aspectName,
    }))[0]
    if (content) {
      this.serverResponse.writeHead(200, {
        'Content-Type': 'application/json',
      })
      this.serverResponse.end(JSON.stringify(content))
    } else {
      this.serverResponse.writeHead(404)
      this.serverResponse.end()
    }
  }

  private async postContent() {
    const payload = await this.utils.readPostBody<{ Type: string & {} }>(this.incomingMessage)
    // tslint:disable-next-line: naming-convention
    const { Type, ...data } = payload
    const contentType = this.store.getByName(Type)
    const content = await this.repository.create({
      contentType,
      data,
    })
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify(content))
  }

  private async patchContent() {
    const payload = await this.utils.readPostBody<ISavedContent<{ aspectName: string }>>(this.incomingMessage)
    const { id, contentTypeRef, creationDate, modificationDate, type, fields, aspectName, ...data } = payload
    const content = await this.repository.update({
      id,
      change: data,
      aspectName,
    })
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify(content))
  }

  private async deleteContent() {
    const payload = await this.utils.readPostBody<number[]>(this.incomingMessage)
    await this.repository.remove(...payload)
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify({ success: true }))
  }

  public async exec(): Promise<void> {
    switch (this.incomingMessage.method) {
      case 'GET': {
        return this.getContent()
      }
      case 'POST': {
        return this.postContent()
      }
      case 'PATCH': {
        return this.patchContent()
      }
      case 'DELETE': {
        return this.deleteContent()
      }
      default: {
        throw Error(`Method '${this.incomingMessage.method}' not supported for this action`)
      }
    }
  }
  /**
   *
   */
  constructor(
    private serverResponse: ServerResponse,
    private incomingMessage: IncomingMessage,
    private utils: Utils,
    private repository: Repository,
    private store: ContentDescriptorStore,
  ) {}
}
