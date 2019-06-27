import '../src'
import { Socket } from 'net'
import { IncomingMessage, ServerResponse } from 'http'

describe('ServerResponse extensions', () => {
  describe('sendJson', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      expect(typeof msg.sendJson).toBe('function')
    })

    it('Should send the response with the correct Content Type header and default status', done => {
      const jsonValue = { value: Math.random() }
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = jest.fn()
      msg.end = (chunk?: any) => {
        expect(chunk).toBe(JSON.stringify(jsonValue))
        expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' })
        done()
      }

      msg.sendJson({
        json: jsonValue,
      })
      expect(typeof msg.sendJson).toBe('function')
    })

    it('Should send the response with overridden status', done => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = jest.fn()
      msg.end = () => {
        expect(msg.writeHead).toBeCalledWith(404, { 'Content-Type': 'application/json' })
        done()
      }

      msg.sendJson({
        statusCode: 404,
        json: {},
      })
      expect(typeof msg.sendJson).toBe('function')
    })

    it('Should send the response with overridden headers', done => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = jest.fn()
      msg.end = () => {
        expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json;encoding=utf8' })
        done()
      }

      msg.sendJson({
        headers: { 'Content-Type': 'application/json;encoding=utf8' },
        json: {},
      })
      expect(typeof msg.sendJson).toBe('function')
    })
  })

  describe('sendPlainText', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      expect(typeof msg.sendPlainText).toBe('function')
    })

    it('Should send the response with the correct Content Type header and default status', done => {
      const textValue = Math.random().toString()
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = jest.fn()
      msg.end = (chunk?: any) => {
        expect(chunk).toBe(textValue)
        expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'plain/text' })
        done()
      }

      msg.sendPlainText({
        text: textValue,
      })
      expect(typeof msg.sendJson).toBe('function')
    })
  })
})
