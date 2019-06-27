import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { PathHelper } from '@sensenet/client-utils'
import { OdataContext } from '../odata-context'

/**
 * OData Root action
 */
@Injectable({ lifetime: 'transient' })
export class RootAction implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    this.resp.sendJson({
      json: {
        '@odata.context': PathHelper.joinPaths(this.ctx.server, this.req.url as string, '$metadata'),
        value: [
          ...this.ctx.collections.map(collection => ({
            name: collection.name,
            kind: 'EntitySet',
            url: collection.name,
          })),
        ],
      },
      headers: {
        'content-type':
          'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8',
      },
    })
  }

  /**
   *
   */
  constructor(private resp: ServerResponse, private req: IncomingMessage, private ctx: OdataContext<any>) {}
}
