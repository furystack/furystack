import type { IncomingMessage } from 'http'
import { RequestError } from '@furystack/rest'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { readPostBody } from './read-post-body.js'

describe('readPostBody', () => {
  it('should reject bodies exceeding the size limit with 413', async () => {
    const payload = JSON.stringify({ data: 'a'.repeat(1024 * 1024 + 1) })
    const req = Object.assign(Readable.from([Buffer.from(payload)]), {
      headers: {},
      readable: true,
    }) as unknown as IncomingMessage
    await expect(readPostBody(req)).rejects.toSatisfy((error: unknown) => {
      return error instanceof RequestError && error.responseCode === 413
    })
  })
})
