import { Socket } from 'net'
import { IncomingMessage, ServerResponse } from 'http'
import { JsonResult } from '@furystack/rest'
import './server-response-extensions'

describe('ServerResponse extensions', () => {
  describe('sendActionResult', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      expect(typeof msg.sendActionResult).toBe('function')
    })

    it('Should send the response with the correct Content Type header and default status', (done) => {
      const jsonValue = { value: Math.random() }
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = jest.fn()
      msg.end = (chunk?: any) => {
        expect(chunk).toBe(JSON.stringify(jsonValue))
        expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' })
        done()
      }

      msg.sendActionResult(JsonResult(jsonValue))
    })
  })
})
