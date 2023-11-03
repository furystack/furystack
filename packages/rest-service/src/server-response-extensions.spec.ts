import { Socket } from 'net'
import { IncomingMessage, ServerResponse } from 'http'
import './server-response-extensions'
import { BypassResult, JsonResult, PlainTextResult } from './request-action-implementation.js'
import { describe, it, expect, vi } from 'vitest'

describe('ServerResponse extensions', () => {
  describe('sendActionResult', () => {
    it('Should be extended', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      expect(typeof msg.sendActionResult).toBe('function')
    })

    it('Should send the JSON response with the correct Content Type header and default status', async () => {
      const jsonValue = { value: Math.random() }
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = vi.fn() as any
      await new Promise<void>((done) => {
        msg.end = ((chunk: any) => {
          expect(chunk).toBe(JSON.stringify(jsonValue))
          expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' })
          done()
        }) as (typeof msg)['end']

        msg.sendActionResult(JsonResult(jsonValue))
      })
    })

    it('Should send the plain TEXT response with the correct Content Type header and default status', async () => {
      const textValue = `${Math.random()}`
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      await new Promise<void>((done) => {
        msg.writeHead = vi.fn() as any
        msg.end = ((chunk: any) => {
          expect(chunk).toBe(textValue)
          expect(msg.writeHead).toBeCalledWith(200, { 'Content-Type': 'plain/text' })
          done()
        }) as (typeof msg)['end']

        msg.sendActionResult(PlainTextResult(textValue))
      })
    })

    it('Should skip sending on BypassResult', () => {
      const socket = new Socket()
      const msg = new ServerResponse(new IncomingMessage(socket))
      msg.writeHead = vi.fn() as any
      msg.end = vi.fn() as any

      msg.sendActionResult(BypassResult())
      expect(msg.writeHead).not.toBeCalled()
      expect(msg.end).not.toBeCalled()
    })
  })
})
