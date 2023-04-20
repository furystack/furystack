import { IncomingMessage } from 'http'
import './incoming-message-extensions'
import { Socket } from 'net'
import { describe, it, expect } from 'vitest'

describe('IncomingMessage extensions', () => {
  describe('readPostBody', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new IncomingMessage(socket)
      expect(typeof msg.readPostBody).toBe('function')
    })

    it('Should read the raw post body', async () => {
      const exampleValue = { value: Math.random().toString() }
      const socket = new Socket()
      const msg = new IncomingMessage(socket)
      setTimeout(() => {
        msg.read = () => JSON.stringify(exampleValue)
        msg.emit('readable')
        msg.emit('end')
      }, 10)

      const result = await msg.readPostBodyRaw()
      expect(result).toEqual(JSON.stringify(exampleValue))
    })

    it('Should read the post body', async () => {
      const exampleValue = { value: Math.random().toString() }
      const socket = new Socket()
      const msg = new IncomingMessage(socket)
      setTimeout(() => {
        msg.read = () => JSON.stringify(exampleValue)
        msg.emit('readable')
        msg.emit('end')
      }, 10)

      const result = await msg.readPostBody()
      expect(result).toEqual(exampleValue)
    })
  })
})
