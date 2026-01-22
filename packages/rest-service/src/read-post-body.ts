import type { IncomingMessage } from 'http'
import './incoming-message-extensions.js'

export const readPostBodyRaw = async (incomingMessage: IncomingMessage) => {
  if (!incomingMessage.readable) {
    throw Error('Incoming message is not readable')
  }

  let body = ''
  await new Promise<void>((resolve, reject) => {
    incomingMessage.on('readable', () => {
      const data = incomingMessage.read() as string
      if (data) {
        body += data
      }
    })
    incomingMessage.on('end', () => {
      resolve()
    })
    incomingMessage.on('error', (err) => {
      reject(err)
    })
  })
  return body
}

/**
 * Reads the post's body and returns a promise with a parsed value
 * @param incomingMessage The incoming message instance
 * @returns the parsed object from the post body
 */
export const readPostBody = async <T>(incomingMessage: IncomingMessage): Promise<T> => {
  const body = (incomingMessage.postBody as T) || (JSON.parse(await readPostBodyRaw(incomingMessage)) as T)
  incomingMessage.postBody = body
  return body
}
