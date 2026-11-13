import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { IncomingMessage } from 'http'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { JsonResult } from './request-action-implementation.js'
import { useRestService } from './helpers.js'
import { readPostBody } from './read-post-body.js'

const toRequest = (payload: string | Buffer, maxBytes?: number) => {
  const body = typeof payload === 'string' ? Buffer.from(payload) : payload
  return {
    req: Object.assign(Readable.from([body]), {
      headers: {},
      readable: true,
    }) as unknown as IncomingMessage,
    options: maxBytes === undefined ? undefined : { maxBytes },
  }
}

describe('readPostBody', () => {
  it('should parse a normal small JSON body', async () => {
    const { req } = toRequest(JSON.stringify({ ok: true }))
    await expect(readPostBody<{ ok: boolean }>(req)).resolves.toEqual({ ok: true })
  })

  it('should accept a body exactly at the size limit', async () => {
    const payload = 'x'.repeat(10)
    const { req, options } = toRequest(payload, 10)
    await expect(readPostBody(req, options)).rejects.toBeInstanceOf(SyntaxError)
  })

  it('should accept a JSON body exactly at the custom byte limit', async () => {
    const payload = JSON.stringify({ a: 'b' })
    const { req, options } = toRequest(payload, Buffer.byteLength(payload))
    await expect(readPostBody<{ a: string }>(req, options)).resolves.toEqual({ a: 'b' })
  })

  it('should reject bodies exceeding the default size limit with 413', async () => {
    const payload = JSON.stringify({ data: 'a'.repeat(1024 * 1024 + 1) })
    const { req } = toRequest(payload)
    await expect(readPostBody(req)).rejects.toSatisfy((error: unknown) => {
      return error instanceof RequestError && error.responseCode === 413
    })
  })

  it('should reject bodies exceeding a custom size limit with 413', async () => {
    const payload = JSON.stringify({ data: 'too-large' })
    const { req, options } = toRequest(payload, 10)
    await expect(readPostBody(req, options)).rejects.toSatisfy((error: unknown) => {
      return error instanceof RequestError && error.responseCode === 413
    })
  })

  it('should accept bodies under a custom size limit', async () => {
    const payload = JSON.stringify({ data: 'ok' })
    const { req, options } = toRequest(payload, 1024)
    await expect(readPostBody<{ data: string }>(req, options)).resolves.toEqual({ data: 'ok' })
  })
})

describe('useRestService maxBodyBytes', () => {
  it('should return 413 when the request body exceeds the configured limit', async () => {
    await usingAsync(createInjector(), async (i) => {
      const port = getPort()
      await useRestService<{
        POST: {
          '/echo': { body: { value: string }; result: { value: string } }
        }
      }>({
        injector: i,
        root: '/api',
        port,
        maxBodyBytes: 16,
        api: {
          POST: {
            '/echo': async ({ getBody }) => JsonResult(await getBody()),
          },
        },
      })

      const response = await fetch(`http://127.0.0.1:${port}/api/echo`, {
        method: 'POST',
        body: JSON.stringify({ value: 'this body is definitely too large' }),
        headers: { 'content-type': 'application/json' },
      })

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toMatchObject({ message: 'Payload Too Large' })
    })
  })
})
