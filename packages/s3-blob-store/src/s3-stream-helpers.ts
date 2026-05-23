import { Readable } from 'node:stream'
import { BlobStoreError } from '@furystack/blob-store'
import type { BlobPutInput } from '@furystack/blob-store'

/**
 * Drains a Node-style readable stream into a single `Uint8Array`. Memory
 * bound — only safe when the caller knows the payload fits in RAM.
 */
export const collectNodeStream = async (stream: NodeJS.ReadableStream): Promise<Uint8Array> => {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

/**
 * Adapts a {@link BlobPutInput} to a body shape the AWS SDK
 * `PutObjectCommand` accepts. Web `ReadableStream` payloads are bridged to
 * a Node `Readable` because the v3 SDK does not natively consume web
 * streams.
 */
export const toUploadBody = (input: BlobPutInput): Readable | Buffer | Uint8Array => {
  if (input instanceof Uint8Array) return input
  if (typeof (input as ReadableStream<Uint8Array>).getReader === 'function') {
    const reader = (input as ReadableStream<Uint8Array>).getReader()
    return new Readable({
      read() {
        reader.read().then(
          ({ done, value }) => {
            if (done) {
              this.push(null)
              return
            }
            this.push(Buffer.from(value))
          },
          (cause: unknown) => {
            this.destroy(cause as Error)
          },
        )
      },
    })
  }
  return Readable.from(input as NodeJS.ReadableStream)
}

const drainNodeStreamToController = async (
  node: NodeJS.ReadableStream,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> => {
  try {
    for await (const chunk of node) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
      controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))
    }
    controller.close()
  } catch (cause) {
    controller.error(cause)
  }
}

/**
 * Adapts an S3 `GetObjectCommand` body (web stream / Node stream / buffer)
 * to a Web `ReadableStream<Uint8Array>` so callers see a uniform body type
 * regardless of which transport the SDK chose at runtime.
 *
 * Throws {@link BlobStoreError} `code: 'io-error'` when the body shape is
 * unrecognized.
 */
export const bodyToWebStream = (body: unknown): ReadableStream<Uint8Array> => {
  if (body && typeof body === 'object' && 'getReader' in body) {
    return body as ReadableStream<Uint8Array>
  }
  if (body && typeof body === 'object' && Symbol.asyncIterator in body) {
    const node = body as NodeJS.ReadableStream
    return new ReadableStream<Uint8Array>({
      start(controller) {
        void drainNodeStreamToController(node, controller)
      },
    })
  }
  if (body instanceof Uint8Array) {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(body)
        controller.close()
      },
    })
  }
  throw new BlobStoreError('io-error', 'Unsupported S3 response body type')
}

/**
 * Drains an S3 response body into a single `Uint8Array`. Used by
 * {@link S3BlobStore.bodyToBuffer} for callers that want the whole payload
 * in memory.
 */
export const bodyToBuffer = async (body: unknown): Promise<Uint8Array> => {
  if (body instanceof Uint8Array) return body
  if (Buffer.isBuffer(body)) return new Uint8Array(body)
  if (typeof body === 'string') return new TextEncoder().encode(body)
  if (body && typeof body === 'object' && 'getReader' in body) {
    const reader = (body as ReadableStream<Uint8Array>).getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const total = chunks.reduce((acc, c) => acc + c.byteLength, 0)
    const merged = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.byteLength
    }
    return merged
  }
  if (body && typeof body === 'object' && Symbol.asyncIterator in body) {
    return collectNodeStream(body as NodeJS.ReadableStream)
  }
  throw new BlobStoreError('io-error', 'Unsupported S3 response body type')
}

/**
 * Strips wrapping double-quotes from an S3 ETag header. The SDK preserves
 * the wire format `"<hex>"`; consumers expect a bare hex string.
 */
export const stripQuotes = (etag: string | undefined): string | undefined => {
  if (etag === undefined) return undefined
  return etag.startsWith('"') && etag.endsWith('"') ? etag.slice(1, -1) : etag
}
