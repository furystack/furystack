import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { BlobStoreError } from '@furystack/blob-store'
import type { ServerApi } from '@furystack/rest-service'
import { verifyToken } from '../sign-token.js'

/**
 * Options accepted by {@link buildFileSystemBlobStoreServerApi}.
 */
export type FileSystemBlobStoreServerApiOptions = {
  /**
   * URL prefix the helper handles, e.g. `'/blobs'`. The single trailing
   * path segment is interpreted as the signed token; everything matching
   * the prefix is dispatched to this server API.
   */
  baseUrl: string
  /** Filesystem root the bound `FileSystemBlobStore` writes under. */
  root: string
  /** HMAC secret matching the bound `FileSystemBlobStore`'s secret. */
  secret: string | Uint8Array
  /** Override `Date.now` for deterministic tests. */
  now?: () => number
}

const writeJsonError = (res: ServerResponse, status: number, code: string, message: string): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ code, message }))
}

const handleError = (res: ServerResponse, error: unknown): void => {
  if (BlobStoreError.is(error)) {
    const httpStatus =
      error.code === 'signature-invalid'
        ? 403
        : error.code === 'not-found'
          ? 404
          : error.code === 'too-large'
            ? 413
            : 400
    writeJsonError(res, httpStatus, error.code, error.message)
    return
  }
  writeJsonError(res, 500, 'io-error', error instanceof Error ? error.message : 'unknown error')
}

const sanitizeKey = (key: string): string[] => {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BlobStoreError('invalid-key', 'Blob key must be a non-empty string', { key })
  }
  if (key.startsWith('/')) {
    throw new BlobStoreError('invalid-key', 'Blob key must not start with `/`', { key })
  }
  const segments = key.split('/')
  for (const segment of segments) {
    if (segment === '..' || segment === '.' || segment === '' || segment.includes('\\') || segment.includes('\0')) {
      throw new BlobStoreError('invalid-key', 'Blob key contains forbidden path segments', { key })
    }
  }
  return segments
}

const matchesBase = (url: string, baseUrl: string): boolean =>
  url === baseUrl || url.startsWith(`${baseUrl}/`) || url.startsWith(`${baseUrl}?`)

const extractToken = (url: string, baseUrl: string): string | undefined => {
  const cleanUrl = url.split('?')[0] ?? ''
  if (!matchesBase(cleanUrl, baseUrl)) return undefined
  const tail = cleanUrl.slice(baseUrl.length).replace(/^\/+/, '')
  if (!tail) return undefined
  return decodeURIComponent(tail)
}

const createSizeEnforcer = (limit: number | undefined): Transform => {
  let received = 0
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.byteLength
      if (limit !== undefined && received > limit) {
        callback(new BlobStoreError('too-large', `Upload exceeds maxBytes of ${limit}`, { limit, actual: received }))
        return
      }
      callback(null, chunk)
    },
  })
}

/**
 * Builds a {@link ServerApi} that mounts upload (`PUT`) and download
 * (`GET`) endpoints under `options.baseUrl`. The trailing URL segment is
 * the signed token returned by `FileSystemBlobStore.getDownloadUrl` /
 * `getUploadUrl`. Requests with mismatched HTTP methods, expired tokens,
 * or oversized uploads return discriminated `{ code, message }` JSON
 * payloads with task-runner-friendly status codes (404 / 403 / 413).
 *
 * Mounted via `useFileSystemBlobStoreEndpoints`; apps may also push the
 * returned `ServerApi` directly into a custom server pool record.
 */
export const buildFileSystemBlobStoreServerApi = (options: FileSystemBlobStoreServerApiOptions): ServerApi => {
  const root = resolve(options.root)
  const baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl

  const handleDownload = async ({ req, res }: { req: IncomingMessage; res: ServerResponse }): Promise<void> => {
    const token = extractToken(req.url ?? '', baseUrl)
    if (!token) {
      writeJsonError(res, 400, 'invalid-config', 'Missing signed token')
      return
    }
    try {
      const payload = verifyToken(token, options.secret, options.now)
      if (payload.o !== 'download') {
        throw new BlobStoreError('signature-invalid', 'Token operation does not allow download')
      }
      const segments = sanitizeKey(payload.k)
      const fullPath = join(root, ...segments)
      let stats: Awaited<ReturnType<typeof stat>>
      try {
        stats = await stat(fullPath)
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new BlobStoreError('not-found', `Blob not found: ${payload.k}`, { key: payload.k })
        }
        throw cause
      }
      res.writeHead(200, {
        'Content-Length': String(stats.size),
        'Content-Type': 'application/octet-stream',
      })
      await pipeline(createReadStream(fullPath), res)
    } catch (error) {
      handleError(res, error)
    }
  }

  const handleUpload = async ({ req, res }: { req: IncomingMessage; res: ServerResponse }): Promise<void> => {
    const token = extractToken(req.url ?? '', baseUrl)
    if (!token) {
      writeJsonError(res, 400, 'invalid-config', 'Missing signed token')
      return
    }
    try {
      const payload = verifyToken(token, options.secret, options.now)
      if (payload.o !== 'upload') {
        throw new BlobStoreError('signature-invalid', 'Token operation does not allow upload')
      }
      const segments = sanitizeKey(payload.k)
      const fullPath = join(root, ...segments)
      await mkdir(dirname(fullPath), { recursive: true })
      const tempPath = `${fullPath}.upload-${randomUUID()}.tmp`
      try {
        await pipeline(req, createSizeEnforcer(payload.m), createWriteStream(tempPath))
        await rename(tempPath, fullPath)
      } catch (cause) {
        await rm(tempPath, { force: true }).catch(() => undefined)
        if (BlobStoreError.is(cause)) throw cause
        throw new BlobStoreError('io-error', `Failed to write uploaded blob ${payload.k}`, { key: payload.k, cause })
      }
      res.writeHead(204)
      res.end()
    } catch (error) {
      handleError(res, error)
    }
  }

  return {
    shouldExec: ({ req }) => {
      if (!req.url) return false
      const method = req.method?.toUpperCase()
      if (method !== 'GET' && method !== 'PUT') return false
      const cleanUrl = req.url.split('?')[0] ?? ''
      return matchesBase(cleanUrl, baseUrl)
    },
    onRequest: async (msg) => {
      const method = msg.req.method?.toUpperCase()
      if (method === 'GET') {
        await handleDownload(msg)
        return
      }
      if (method === 'PUT') {
        await handleUpload(msg)
        return
      }
      writeJsonError(msg.res, 405, 'invalid-config', 'Method not allowed')
    },
  }
}
