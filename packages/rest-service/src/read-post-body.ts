import type { IncomingMessage } from 'http'
import { RequestError } from '@furystack/rest'
import './incoming-message-extensions.js'

/** Default maximum accepted request body size (1 MiB). */
export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

export type ReadPostBodyOptions = {
  /** Maximum allowed body size in bytes. Defaults to {@link DEFAULT_MAX_BODY_BYTES}. */
  maxBytes?: number
}

/**
 * Reads the full request body into a Buffer and returns it as a UTF-8 string.
 * Throws `RequestError(413)` when the body exceeds `options.maxBytes`.
 */
export const readPostBodyRaw = async (incomingMessage: IncomingMessage, options?: ReadPostBodyOptions) => {
  if (!incomingMessage.readable) {
    throw Error('Incoming message is not readable')
  }

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BODY_BYTES
  const chunks: Buffer[] = []
  let received = 0

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      incomingMessage.removeListener('data', onData)
      incomingMessage.removeListener('end', onEnd)
      incomingMessage.removeListener('error', onError)
    }

    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      received += buffer.length
      if (received > maxBytes) {
        cleanup()
        incomingMessage.destroy()
        reject(new RequestError('Payload Too Large', 413))
        return
      }
      chunks.push(buffer)
    }

    const onEnd = () => {
      cleanup()
      resolve()
    }

    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }

    incomingMessage.on('data', onData)
    incomingMessage.on('end', onEnd)
    incomingMessage.on('error', onError)
  })

  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Reads the post's body and returns a promise with a parsed value.
 * @param incomingMessage The incoming message instance
 * @param options Optional size limit overrides
 * @returns the parsed object from the post body
 */
export const readPostBody = async <T>(incomingMessage: IncomingMessage, options?: ReadPostBodyOptions): Promise<T> => {
  const body = (incomingMessage.postBody as T) || (JSON.parse(await readPostBodyRaw(incomingMessage, options)) as T)
  incomingMessage.postBody = body
  return body
}
