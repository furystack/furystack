import { createClient } from './'
import { PathHelper } from '@furystack/utils'

const endpointUrl = 'http://localhost'

globalThis.fetch = (globalThis as any).fecth || (() => null)

describe('@furystack/rest-client-fetch', () => {
  it('Should return a method', () => {
    const result = createClient({ endpointUrl, fetch: () => undefined as any })
    expect(typeof result).toBe('function')
  })

  it('Should create with native Fetch by default', () => {
    const result = createClient({ endpointUrl })
    expect(typeof result).toBe('function')
  })

  it('Should throw if request is not OK', async () => {
    const json = jest.fn(async () => ({ value: 1 }))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: false,
    }))

    const client = createClient<{ GET: { '/test': { result: { foo: number } } } }>({
      endpointUrl,
      fetch,
    })

    await expect(
      client({
        action: '/test',
        method: 'GET',
      }),
    ).rejects.toThrow('')
  })

  it('Should call a simple GET request', async () => {
    const json = jest.fn(async () => ({ value: 1 }))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ GET: { '/test': { result: { value: number } } } }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), { method: 'GET', body: undefined })
    expect(json).toBeCalled()
  })

  it('Should call a GET request with query parameters', async () => {
    const json = jest.fn(async () => ({ value: 1 }))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{
      GET: { '/test': { result: { value: number }; query: { value: string } } }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
      query: { value: 'asdasd' },
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test?value=asdasd'), {
      method: 'GET',
      body: undefined,
    })
    expect(json).toBeCalled()
  })

  it('Should call a GET request with URL parameters', async () => {
    const json = jest.fn(async () => ({ value: 1 }))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{
      GET: { '/test/:urlValue': { result: { value: number }; url: { urlValue: string } } }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test/:urlValue',
      method: 'GET',
      url: { urlValue: 'asd' },
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test/asd'), {
      method: 'GET',
      body: undefined,
    })
    expect(json).toBeCalled()
  })

  it('Should call a simple POST request with body', async () => {
    const json = jest.fn(async () => ({}))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ POST: { '/test': { result: {}; body: { foo: number } } } }>({
      endpointUrl,
      fetch,
    })

    await client({
      action: '/test',
      method: 'POST',
      body: { foo: 3 },
    })

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      body: JSON.stringify({ foo: 3 }),
    })
    expect(json).toBeCalled()
  })

  it('Should call a request with headers', async () => {
    const json = jest.fn(async () => ({}))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ POST: { '/test': { result: {}; headers: { token: string } } } }>({
      endpointUrl,
      fetch,
    })

    await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(json).toBeCalled()
  })

  it('Should parse a response with text/ headers', async () => {
    const text = jest.fn(async () => 'alma')
    const fetch: any = jest.fn(async () => ({
      text,
      headers: {
        get: () => 'text/plain',
      },
      ok: true,
    }))

    const client = createClient<{
      POST: { '/test': { result: string; headers: { token: string } } }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(result.result).toBe('alma')

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(text).toBeCalled()
  })

  it('Should parse a response with form/multipart headers', async () => {
    const exampleValue = { foo: 1, bar: 'alma' }
    const formData = jest.fn(async () => exampleValue)
    const fetch: any = jest.fn(async () => ({
      formData,
      headers: {
        get: () => 'form/multipart',
      },
      ok: true,
    }))

    const client = createClient<{
      POST: { '/test': { result: string; headers: { token: string } } }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(result.result).toBe(exampleValue)

    expect(fetch).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(formData).toBeCalled()
  })
})
