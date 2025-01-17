import { Injectable, Injected } from '@furystack/inject'
import { createReadStream } from 'fs'
import { access, stat } from 'fs/promises'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { getMimeForFile } from './mime-types.js'
import { join, normalize, sep } from 'path'
import { ServerManager } from './server-manager.js'

export interface StaticServerOptions {
  baseUrl: string
  path: string
  hostName?: string
  port: number
  fallback?: string
  headers?: OutgoingHttpHeaders
}

@Injectable({ lifetime: 'singleton' })
export class StaticServerManager {
  @Injected(ServerManager)
  declare private readonly serverManager: ServerManager

  private async sendFile({
    fullPath,
    headers,
    res,
  }: {
    fullPath: string
    res: ServerResponse
    headers?: OutgoingHttpHeaders
  }) {
    const { size } = await stat(fullPath)

    await access(fullPath)

    const head = {
      ...headers,
      'Content-Length': size,
      'Content-Type': getMimeForFile(fullPath),
    }
    Object.entries(head).map(([key, value]) => res.setHeader(key, value))
    await new Promise<void>((resolve, reject) =>
      createReadStream(fullPath, { autoClose: true }).once('finish', resolve).once('error', reject).pipe(res),
    )
  }

  public shouldExec =
    (baseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url &&
      req.method?.toUpperCase() === 'GET' &&
      (req.url === baseUrl || req.url.startsWith(baseUrl[baseUrl.length - 1] === '/' ? baseUrl : `${baseUrl}/`))
        ? true
        : false

  private onRequest = ({
    path,
    baseUrl,
    fallback,
    headers,
  }: {
    path: string
    baseUrl: string
    fallback?: string
    headers?: OutgoingHttpHeaders
  }) => {
    return async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      const filePath = (req.url as string).substring(baseUrl.length - 1).replaceAll('/', sep)
      const fullPath = normalize(join(path, filePath))

      try {
        await this.sendFile({ fullPath, res, headers })
      } catch (error) {
        if (fallback) {
          await this.sendFile({ fullPath: normalize(join(path, fallback)), res, headers })
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        }
      }
    }
  }

  public async addStaticSite(options: StaticServerOptions) {
    const server = await this.serverManager.getOrCreate({ hostName: options.hostName, port: options.port })

    server.apis.push({
      shouldExec: this.shouldExec(options.baseUrl),
      onRequest: this.onRequest({ ...options }),
    })
  }
}
