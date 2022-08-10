import { Injectable, Injected } from '@furystack/inject'
import { PathHelper } from '@furystack/utils'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { ServerResponse } from 'http'
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

  public async addStaticSite(options: StaticServerOptions) {
    const server = await this.serverManager.getOrCreate({ hostName: options.hostName, port: options.port })

    server.apis.push({
      shouldExec: ({ req }) =>
        req.url &&
        req.method?.toUpperCase() === 'GET' &&
        `/${PathHelper.normalize(req.url).startsWith(options.baseUrl)}`
          ? true
          : false,
      onRequest: async ({ req, res }) => {
        const rootPath = join(process.cwd(), options.path)
        const filePath = PathHelper.normalize(req.url as string)
          .replace(options.baseUrl, '')
          .replace('/', sep)
        const fullPath = join(rootPath, filePath)

        try {
          await this.sendFile(fullPath, res)
        } catch (error) {
          if (options.fallback) {
            await this.sendFile(join(rootPath, options.fallback), res)
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not found')
          }
        }
      },
    })
  }
}
