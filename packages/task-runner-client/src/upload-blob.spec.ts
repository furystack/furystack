import { describe, expect, it, vi } from 'vitest'
import { TaskRunnerClientError } from './task-runner-client-error.js'
import { uploadBlob } from './upload-blob.js'
import type { FetchLike } from './upload-blob.js'

const okResponse = (status = 200): Response => ({ ok: status < 400, status }) as Response

describe('uploadBlob', () => {
  describe('presigned-direct (PUT)', () => {
    it('sends the body as the raw request body with the content type', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse())
      await uploadBlob({ url: 'https://blobs/put', method: 'PUT' }, 'hello', {
        contentType: 'text/plain',
        fetchImpl,
      })

      expect(fetchImpl).toHaveBeenCalledTimes(1)
      const [url, init] = fetchImpl.mock.calls[0]
      expect(url).toBe('https://blobs/put')
      expect(init?.method).toBe('PUT')
      expect(init?.body).toBe('hello')
      expect(init?.headers).toEqual({ 'Content-Type': 'text/plain' })
    })

    it('omits headers when no content type is given', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse())
      await uploadBlob({ url: 'https://blobs/put', method: 'PUT' }, 'data', { fetchImpl })
      expect(fetchImpl.mock.calls[0][1]?.headers).toBeUndefined()
    })
  })

  describe('POST policy', () => {
    it('builds a multipart form with the fields and the file part last', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse())
      await uploadBlob({ url: 'https://blobs/post', method: 'POST', fields: { key: 'k1', policy: 'p1' } }, 'payload', {
        contentType: 'application/octet-stream',
        fetchImpl,
      })

      const [url, init] = fetchImpl.mock.calls[0]
      expect(url).toBe('https://blobs/post')
      expect(init?.method).toBe('POST')
      const form = init?.body as FormData
      expect(form).toBeInstanceOf(FormData)
      expect(form.get('key')).toBe('k1')
      expect(form.get('policy')).toBe('p1')
      expect(form.get('file')).toBeInstanceOf(Blob)
      expect([...form.keys()].at(-1)).toBe('file')
    })
  })

  describe('failures', () => {
    it('throws TaskRunnerClientError on a non-2xx response', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse(500))
      await expect(uploadBlob({ url: 'https://blobs/put', method: 'PUT' }, 'x', { fetchImpl })).rejects.toMatchObject({
        code: 'upload-failed',
        status: 500,
      })
      await expect(uploadBlob({ url: 'https://blobs/put', method: 'PUT' }, 'x', { fetchImpl })).rejects.toBeInstanceOf(
        TaskRunnerClientError,
      )
    })
  })
})
