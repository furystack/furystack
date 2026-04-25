import { PathHelper } from '@furystack/utils'
import { createReadStream } from 'fs'
import { access, stat } from 'fs/promises'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { join, normalize, sep } from 'path'
import type { ServerApi } from './http-server-pool.js'
import { getMimeForFile } from './mime-types.js'

/**
 * Options accepted by {@link buildStaticSiteServerApi} and
 * {@link useStaticFiles}.
 */
export interface StaticServerOptions {
  baseUrl: string
  path: string
  hostName?: string
  port: number
  fallback?: string
  headers?: OutgoingHttpHeaders
}

const sendFile = async ({
  fullPath,
  headers,
  res,
}: {
  fullPath: string
  res: ServerResponse
  headers?: OutgoingHttpHeaders
}): Promise<void> => {
  const { size } = await stat(fullPath)
  await access(fullPath)
  const head = {
    ...headers,
    'Content-Length': size,
    'Content-Type': getMimeForFile(fullPath),
  }
  Object.entries(head).forEach(([key, value]) => res.setHeader(key, value))
  await new Promise<void>((resolve, reject) =>
    createReadStream(fullPath, { autoClose: true }).once('finish', resolve).once('error', reject).pipe(res),
  )
}

/**
 * Builds a {@link ServerApi} that serves files under `options.path` for every
 * GET request whose URL matches `options.baseUrl`. Falls back to
 * `options.fallback` (if set) for missing files, otherwise responds with 404.
 */
export const buildStaticSiteServerApi = (options: StaticServerOptions): ServerApi => {
  const onRequest = async ({ req, res }: { req: IncomingMessage; res: ServerResponse }): Promise<void> => {
    const extractedPath = PathHelper.extractPath(req.url as string, options.baseUrl)
    const filePath = (extractedPath || '/').replaceAll('/', sep)
    const fullPath = normalize(join(options.path, filePath))
    try {
      await sendFile({ fullPath, res, headers: options.headers })
    } catch {
      if (options.fallback) {
        await sendFile({ fullPath: normalize(join(options.path, options.fallback)), res, headers: options.headers })
        return
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
    }
  }

  return {
    shouldExec: ({ req }) =>
      req.url !== undefined &&
      req.method?.toUpperCase() === 'GET' &&
      PathHelper.matchesBaseUrl(req.url, options.baseUrl)
        ? true
        : false,
    onRequest,
  }
}
