import type { Readable } from 'node:stream'
import type { BlobPutInput } from './types.js'

/**
 * Coerces any accepted {@link BlobPutInput} variant into a Web
 * `ReadableStream<Uint8Array>` so adapters work with one shape.
 *
 * - `Buffer` / `Uint8Array` → single-chunk stream (eagerly materialised).
 * - Web `ReadableStream` → returned as-is.
 * - Node `Readable` → bridged via `Readable.toWeb`.
 *
 * The returned stream emits `Uint8Array` chunks regardless of whether
 * the source produced `Buffer` (Node streams) or already `Uint8Array`
 * (Web streams) — backends can rely on the chunk type.
 */
export const normalizePutInput = (input: BlobPutInput): ReadableStream<Uint8Array> => {
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input)
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(copy)
        controller.close()
      },
    })
  }
  if (typeof (input as ReadableStream<Uint8Array>).getReader === 'function') {
    return input as ReadableStream<Uint8Array>
  }
  const nodeStream = input as NodeJS.ReadableStream
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const cleanup = (): void => {
        nodeStream.removeListener('data', onData)
        nodeStream.removeListener('end', onEnd)
        nodeStream.removeListener('error', onError)
      }
      const fail = (error: unknown): void => {
        if (closed) return
        closed = true
        controller.error(error)
        cleanup()
      }
      const finish = (): void => {
        if (closed) return
        closed = true
        controller.close()
        cleanup()
      }
      function onData(chunk: unknown): void {
        if (closed) return
        if (chunk === null || chunk === undefined) return
        if (chunk instanceof Uint8Array) {
          controller.enqueue(chunk)
        } else if (typeof chunk === 'string') {
          controller.enqueue(new TextEncoder().encode(chunk))
        } else if (ArrayBuffer.isView(chunk)) {
          controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength))
        } else if (Array.isArray(chunk)) {
          controller.enqueue(new Uint8Array(chunk as number[]))
        } else {
          fail(new TypeError(`Unsupported Node stream chunk type: ${typeof chunk}`))
        }
      }
      function onEnd(): void {
        finish()
      }
      function onError(error: Error): void {
        fail(error)
      }
      nodeStream.on('data', onData)
      nodeStream.on('end', onEnd)
      nodeStream.on('error', onError)
    },
    cancel(reason) {
      if (typeof (nodeStream as Readable).destroy === 'function') {
        ;(nodeStream as Readable).destroy(reason instanceof Error ? reason : undefined)
      }
    },
  })
}

/**
 * Drains a Web `ReadableStream<Uint8Array>` into a single contiguous
 * `Uint8Array`. Memory-bound — only safe when the caller has already
 * decided the payload fits in RAM (in-memory adapter, signed-URL
 * pre-checks, …).
 */
export const collectStream = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
    }
  } finally {
    reader.releaseLock()
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}
