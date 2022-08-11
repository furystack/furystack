import { Injectable, Injected } from '@furystack/inject'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { IncomingMessage, ServerResponse } from 'http'
import { getMimeForFile } from './mime-types'
import { join, sep } from 'path'
import { ServerManager } from './server-manager'

export interface StaticServerOptions {
  baseUrl: string
  path: string
  hostName?: string
  port: number
  fallback?: string
}

@Injectable({ lifetime: 'singleton' })
export class StaticServerManager {
  @Injected(ServerManager)
  private readonly serverManager!: ServerManager

  private async sendFile(filePath: string, res: ServerResponse) {
    const { size } = await stat(filePath)

    const head = {
      'Content-Length': size,
      'Content-Type': getMimeForFile(filePath),
    }

    res.writeHead(200, head)
    createReadStream(filePath, { autoClose: true }).pipe(res)
  }

  public shouldExec =
    (baseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url &&
      req.method?.toUpperCase() === 'GET' &&
      (req.url === baseUrl || req.url.startsWith(baseUrl[baseUrl.length - 1] === '/' ? baseUrl : `${baseUrl}/`))
        ? true
        : false

  private onRequest =
    (path: string, baseUrl: string, fallback?: string) =>
    async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      const rootPath = join(process.cwd(), path)
      const filePath = (req.url as string).substring(baseUrl.length - 1).replaceAll('/', sep)
      const fullPath = join(rootPath, filePath)

      try {
        await this.sendFile(fullPath, res)
      } catch (error) {
        if (fallback) {
          await this.sendFile(join(rootPath, fallback), res)
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        }
      }
    }

  public async addStaticSite(options: StaticServerOptions) {
    const server = await this.serverManager.getOrCreate({ hostName: options.hostName, port: options.port })

    server.apis.push({
      shouldExec: this.shouldExec(options.baseUrl),
      onRequest: this.onRequest(options.path, options.baseUrl, options.fallback),
    })
  }
}
