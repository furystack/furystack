import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { PathHelper } from '@sensenet/client-utils'
import { OdataContext } from '../odata-context'
// import { XmlNode, xmlToString } from '../xml-utils'

/**
 * OData Root action
 */
@Injectable({ lifetime: 'transient' })
export class RootAction implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    this.resp.setHeader(
      'content-type',
      'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8',
    )
    this.resp.end(
      JSON.stringify({
        '@odata.context': PathHelper.joinPaths(this.ctx.server, this.req.url as string, '$metadata'),
        value: [
          ...this.ctx.collections.map(collection => ({
            name: collection.name,
            kind: 'EntitySet',
            url: collection.name,
          })),
        ],
      }),
    )
    // this.resp.setHeader('content-type', 'application/xml')
    // this.resp.end(
    //   xmlToString({
    //     tagName: 'service',
    //     attributes: {
    //       xmlns: 'http://www.w3.org/2007/app',
    //       'xmlns:atom': 'http://www.w3.org/2005/Atom',
    //       'xmlns:m': 'http://docs.oasis-open.org/odata/ns/metadata',
    //       'xml:base': PathHelper.joinPaths(this.ctx.server, this.req.url as string) + '/',
    //       'm:context': PathHelper.joinPaths(this.ctx.server, this.req.url as string, '$metadata') + '/',
    //     },
    //     children: [
    //       {
    //         tagName: 'workspace',
    //         children: [
    //           {
    //             tagName: 'atom:title',
    //             attributes: {
    //               type: 'text',
    //             },
    //             children: ['Default'],
    //           },
    //           ...this.ctx.collections.map(
    //             collection =>
    //               ({
    //                 tagName: 'collection',
    //                 attributes: {
    //                   href: collection.name,
    //                 },
    //                 children: [
    //                   {
    //                     tagName: 'atom:title',
    //                     attributes: {
    //                       type: 'text',
    //                     },
    //                     children: [collection.name],
    //                   },
    //                 ],
    //               } as XmlNode),
    //           ),
    //         ],
    //       },
    //     ],
    //   }),
    // )
  }

  /**
   *
   */
  constructor(private resp: ServerResponse, private req: IncomingMessage, private ctx: OdataContext<any>) {}
}
