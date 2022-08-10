import { Injectable, Injected } from '@furystack/inject'
import { PathHelper } from '@furystack/utils'
import { PathLike } from 'fs'
import { IncomingMessage } from 'http'
import { join, sep } from 'path'
import { ServerManager } from 'server-manager'

export interface StaticServerOptions {
  baseUrl: string
  path: PathLike
  hostName?: string
  port: number
  fallback?: string
}

@Injectable({ lifetime: 'singleton' })
export class StaticServerManager {
  @Injected(ServerManager)
  private readonly serverManager!: ServerManager

  private async streamFile(filePath: string, msg: IncomingMessage) {}

  public async addStaticSite(options: StaticServerOptions) {
    const server = await this.serverManager.getOrCreate({ hostName: options.hostName, port: options.port })

    server.apis.push({
      shouldExec: (msg) =>
        msg.req.url &&
        msg.req.method?.toUpperCase() === 'GET' &&
        PathHelper.normalize(msg.req.url).startsWith(options.baseUrl)
          ? true
          : false,
      onRequest: async ({ req, res }) => {
        const filePath = PathHelper.normalize(req.url as string)
          .replace(options.baseUrl, '')
          .replace('/', sep)
        const fullPath = join(options.path.toString(), filePath)

        try {
        } catch (error) {}
      },
    })
  }
}
