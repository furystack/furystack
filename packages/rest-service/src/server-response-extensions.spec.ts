import { Socket } from 'net'
import { IncomingMessage, ServerResponse } from 'http'
import './server-response-extensions'
import { BypassResult, JsonResult, PlainTextResult } from './request-action-implementation.js'
import { describe, expect, it, vi } from 'vitest'

describe('ServerResponse extensions', () => {
  describe('sendActionResult', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      expect(typeof msg.sendActionResult).toBe('function')
    })

    it('Should send the JSON response with the correct Content Type header and default status', async () => {
      await new Promise<void>((resolve) => {
        const jsonValue = { value: Math.random() }
        const socket = new Socket()
        const msg = new ServerResponse(new IncomingMessage(socket))
        msg.writeHead = vi.fn(() => msg)
        msg.end = ((chunk: any) => {
          expect(chunk).toBe(JSON.stringify(jsonValue))
          expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' })
          resolve()
        }) as typeof msg['end']

        msg.sendActionResult(JsonResult(jsonValue))
      })
    })

    it('Should send the plain TEXT response with the correct Content Type header and default status', async () => {
      await new Promise<void>((resolve) => {
        const textValue = `${Math.random()}`
        const socket = new Socket()
        const msg = new ServerResponse(new IncomingMessage(socket))
        msg.writeHead = vi.fn(() => msg)
        msg.end = ((chunk: any) => {
          expect(chunk).toBe(textValue)
          expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'plain/text' })
          resolve()
        }) as typeof msg['end']

        msg.sendActionResult(PlainTextResult(textValue))
      })
    })

    it('Should skip sending on BypassResult', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = vi.fn(() => msg)
      msg.end = vi.fn(() => msg)

      msg.sendActionResult(BypassResult())
      expect(msg.writeHead).not.toBeCalled()
      expect(msg.end).not.toBeCalled()
    })
  })
})
