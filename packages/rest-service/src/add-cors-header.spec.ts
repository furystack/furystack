import { IncomingMessage, ServerResponse } from 'http'
import { Utils } from './utils'

describe('AddCorsHeaders', () => {
  const utils = new Utils()
  it('Should NOT add headers for non-cross-site requests', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://localhost' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['https://google.com'],
        credentials: true,
        headers: ['my-custom-header', 'header-2'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).not.toBeCalled()
  })

  it('Should NOT add headers for not-enabled hosts', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://google.com' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['https://github.com'],
        credentials: true,
        headers: ['my-custom-header', 'header-2'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).not.toBeCalled()
  })

  it('Should add allow-origin header for enabled hosts', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://github.com' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['http://localhost/'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).toBeCalledTimes(1)
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'http://localhost/')
  })

  it('Should add allow-credentials header if enabled', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://github.com' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['http://localhost/'],
        credentials: true,
        // headers: ['my-custom-header', 'header-2'],
        // methods: ['DELETE', 'GET', 'POST', 'PUT', 'PATCH'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).toBeCalledTimes(2)
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'http://localhost/')
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Credentials', 'true')
    // expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Headers', 'my-custom-header, header-2')
    // expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT, PATCH')
  })

  it('Should add allow-headers header if enabled', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://github.com' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['http://localhost/'],
        headers: ['my-custom-header', 'header-2'],
        // methods: ['DELETE', 'GET', 'POST', 'PUT', 'PATCH'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).toBeCalledTimes(2)
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'http://localhost/')
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Headers', 'my-custom-header, header-2')
    // expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT, PATCH')
  })

  it('Should add allow-methods header if enabled', () => {
    const req: IncomingMessage = {
      headers: { origin: 'http://localhost/', host: 'http://github.com' },
    } as any as IncomingMessage
    const resp: ServerResponse = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse

    utils.addCorsHeaders(
      {
        origins: ['http://localhost/'],
        methods: ['DELETE', 'GET', 'POST', 'PUT', 'PATCH'],
      },
      req,
      resp,
    )
    expect(resp.setHeader).toBeCalledTimes(2)
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'http://localhost/')
    expect(resp.setHeader).toBeCalledWith('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT, PATCH')
  })
})
