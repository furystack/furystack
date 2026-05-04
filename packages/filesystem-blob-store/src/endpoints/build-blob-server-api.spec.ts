import type { AddressInfo } from 'node:net'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FileSystemBlobStore } from '../filesystem-blob-store.js'
import { MIN_SECRET_LENGTH } from '../sign-token.js'
import { buildFileSystemBlobStoreServerApi } from './build-blob-server-api.js'

const SECRET = 'a'.repeat(MIN_SECRET_LENGTH)

type RequestResponse = {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: string
}

const startServer = async (
  api: ReturnType<typeof buildFileSystemBlobStoreServerApi>,
): Promise<{ port: number; close: () => Promise<void> }> => {
  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (api.shouldExec({ req, res })) {
      await api.onRequest({ req, res })
    } else {
      res.writeHead(418)
      res.end('teapot')
    }
  }
  const server = createServer((req, res) => {
    handler(req, res).catch((cause: unknown) => {
      res.writeHead(500)
      res.end(String(cause))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  return {
    port,
    close: () => new Promise<void>((resolve, reject) => server.close((cause) => (cause ? reject(cause) : resolve()))),
  }
}

const send = async (
  port: number,
  method: 'GET' | 'PUT' | 'POST',
  path: string,
  body?: string | Uint8Array,
): Promise<RequestResponse> => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    body: body as BodyInit | undefined,
  })
  const text = await response.text()
  const headers: Record<string, string | string[] | undefined> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  return { status: response.status, headers, body: text }
}

describe('buildFileSystemBlobStoreServerApi', () => {
  let root: string
  let store: FileSystemBlobStore
  let server: { port: number; close: () => Promise<void> }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'furystack-fs-blob-endpoints-'))
    store = new FileSystemBlobStore({
      root,
      secret: SECRET,
      publicUrlBase: 'http://127.0.0.1/blobs',
    })
    server = await startServer(
      buildFileSystemBlobStoreServerApi({
        baseUrl: '/blobs',
        root,
        secret: SECRET,
      }),
    )
  })

  afterEach(async () => {
    store[Symbol.dispose]()
    await server.close()
    await rm(root, { recursive: true, force: true })
  })

  describe('shouldExec', () => {
    it('does not match unrelated URLs', () => {
      const api = buildFileSystemBlobStoreServerApi({ baseUrl: '/blobs', root, secret: SECRET })
      expect(api.shouldExec({ req: { method: 'GET', url: '/other' } as IncomingMessage } as never)).toBe(false)
    })

    it('does not match unsupported methods', () => {
      const api = buildFileSystemBlobStoreServerApi({ baseUrl: '/blobs', root, secret: SECRET })
      expect(api.shouldExec({ req: { method: 'POST', url: '/blobs/x' } as IncomingMessage } as never)).toBe(false)
    })

    it('returns false when url is missing', () => {
      const api = buildFileSystemBlobStoreServerApi({ baseUrl: '/blobs', root, secret: SECRET })
      expect(api.shouldExec({ req: { method: 'GET' } as IncomingMessage } as never)).toBe(false)
    })
  })

  describe('upload + download round-trip', () => {
    it('PUT writes a file and GET streams it back', async () => {
      const uploadUrl = await store.getUploadUrl('roundtrip/file.bin', { ttlSec: 60, maxBytes: 16 })
      const path = uploadUrl.url.replace('http://127.0.0.1', '')
      const put = await send(server.port, 'PUT', path, 'hello-world')
      expect(put.status).toBe(204)
      expect(await readFile(join(root, 'roundtrip/file.bin'), 'utf8')).toBe('hello-world')

      const downloadUrl = await store.getDownloadUrl('roundtrip/file.bin', { ttlSec: 60 })
      const downloadPath = downloadUrl.replace('http://127.0.0.1', '')
      const get = await send(server.port, 'GET', downloadPath)
      expect(get.status).toBe(200)
      expect(get.body).toBe('hello-world')
    })

    it('rejects PUT exceeding maxBytes with 413', async () => {
      const uploadUrl = await store.getUploadUrl('too-big', { ttlSec: 60, maxBytes: 4 })
      const path = uploadUrl.url.replace('http://127.0.0.1', '')
      const put = await send(server.port, 'PUT', path, 'too-large-payload')
      expect(put.status).toBe(413)
      expect(JSON.parse(put.body) as { code: string }).toMatchObject({ code: 'too-large' })
      // Temp file has been cleaned up.
      const sentinel = join(root, 'too-big')
      const exists = await readFile(sentinel).then(
        () => true,
        () => false,
      )
      expect(exists).toBe(false)
    })
  })

  describe('error mapping', () => {
    it('returns 400 on missing token', async () => {
      const result = await send(server.port, 'GET', '/blobs/')
      expect(result.status).toBe(400)
      expect(JSON.parse(result.body) as { code: string }).toMatchObject({ code: 'invalid-config' })
    })

    it('returns 403 on tampered token', async () => {
      const url = await store.getDownloadUrl('any', { ttlSec: 60 })
      const path = `${url.replace('http://127.0.0.1', '').slice(0, -1)}x`
      const result = await send(server.port, 'GET', path)
      expect(result.status).toBe(403)
      expect(JSON.parse(result.body) as { code: string }).toMatchObject({ code: 'signature-invalid' })
    })

    it('returns 403 on operation mismatch (download token used for PUT)', async () => {
      const downloadUrl = await store.getDownloadUrl('mismatch', { ttlSec: 60 })
      const path = downloadUrl.replace('http://127.0.0.1', '')
      const result = await send(server.port, 'PUT', path, 'body')
      expect(result.status).toBe(403)
    })

    it('returns 404 on download for missing key', async () => {
      const url = await store.getDownloadUrl('never-uploaded', { ttlSec: 60 })
      const path = url.replace('http://127.0.0.1', '')
      const result = await send(server.port, 'GET', path)
      expect(result.status).toBe(404)
    })

    it('returns 400 on traversal segments inside a token', async () => {
      // Forge a token containing an unsafe key — we sign it using the same secret as the server.
      const { signToken } = await import('../sign-token.js')
      const token = signToken(
        { k: 'a/../escape', o: 'download', e: Math.floor(Date.now() / 1000) + 60, n: 'n' },
        SECRET,
      )
      const result = await send(server.port, 'GET', `/blobs/${encodeURIComponent(token)}`)
      expect(result.status).toBe(400)
      expect(JSON.parse(result.body) as { code: string }).toMatchObject({ code: 'invalid-key' })
    })

    it('returns 400 on missing token for PUT', async () => {
      const result = await send(server.port, 'PUT', '/blobs/', 'body')
      expect(result.status).toBe(400)
      expect(JSON.parse(result.body) as { code: string }).toMatchObject({ code: 'invalid-config' })
    })

    it('returns 500 wrapping unexpected stat errors on download (symlink loop)', async () => {
      const { signToken } = await import('../sign-token.js')
      const { symlink } = await import('node:fs/promises')
      await symlink('loop', join(root, 'loop'))
      const token = signToken({ k: 'loop', o: 'download', e: Math.floor(Date.now() / 1000) + 60, n: 'n' }, SECRET)
      const result = await send(server.port, 'GET', `/blobs/${encodeURIComponent(token)}`)
      expect(result.status).toBe(500)
    })

    it('returns 403 on operation mismatch (upload token used for GET)', async () => {
      const uploadUrl = await store.getUploadUrl('mismatch-get', { ttlSec: 60 })
      const path = uploadUrl.url.replace('http://127.0.0.1', '')
      const result = await send(server.port, 'GET', path)
      expect(result.status).toBe(403)
    })

    it('returns 400 on forged token with empty key', async () => {
      const { signToken } = await import('../sign-token.js')
      const token = signToken({ k: '', o: 'download', e: Math.floor(Date.now() / 1000) + 60, n: 'n' }, SECRET)
      const result = await send(server.port, 'GET', `/blobs/${encodeURIComponent(token)}`)
      expect(result.status).toBe(400)
      expect(JSON.parse(result.body) as { code: string }).toMatchObject({ code: 'invalid-key' })
    })

    it('returns 400 on forged token with leading-slash key', async () => {
      const { signToken } = await import('../sign-token.js')
      const token = signToken({ k: '/leading', o: 'download', e: Math.floor(Date.now() / 1000) + 60, n: 'n' }, SECRET)
      const result = await send(server.port, 'GET', `/blobs/${encodeURIComponent(token)}`)
      expect(result.status).toBe(400)
    })

    it('returns 405 on a non-GET/PUT method matched manually (defensive case)', async () => {
      const api = buildFileSystemBlobStoreServerApi({ baseUrl: '/blobs', root, secret: SECRET })
      // shouldExec rejects POST but a caller may dispatch directly. Verify the safety net.
      const captured: { status?: number; body?: string } = {}
      const fakeRes = {
        writeHead: (status: number) => {
          captured.status = status
        },
        end: (body: string) => {
          captured.body = body
        },
      } as unknown as ServerResponse
      await api.onRequest({ req: { url: '/blobs/whatever', method: 'POST' } as IncomingMessage, res: fakeRes })
      expect(captured.status).toBe(405)
    })
  })
})
