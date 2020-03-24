import { createClient } from './'
import { RequestAction } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'

const endpointUrl = 'http://localhost'

describe('@furystack/rest-client-fetch', () => {
  it('Should return a method', () => {
    const result = createClient({ endpointUrl, fetch: () => undefined as any })
    expect(typeof result).toBe('function')
  })

  it('Should throw if request is not OK', async () => {
    const json = jest.fn(async () => ({ value: 1 }))
    const fetch: any = jest.fn(async () => ({
      json,
      ok: false,
    }))

    const client = createClient<{ GET: { '/test': RequestAction<{ result: { foo: number } }> } }>({
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

    const client = createClient<{ GET: { '/test': RequestAction<{ result: { foo: number } }> } }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
    })

    expect(result).toStrictEqual({ value: 1 })

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
      GET: { '/test': RequestAction<{ result: { foo: number }; query: { value: string } }> }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
      query: { value: 'asdasd' },
    })

    expect(result).toStrictEqual({ value: 1 })

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
      GET: { '/test/:urlValue': RequestAction<{ result: { foo: number }; url: { urlValue: string } }> }
    }>({
      endpointUrl,
      fetch,
    })

    const result = await client({
      action: '/test/:urlValue',
      method: 'GET',
      url: { urlValue: 'asd' },
    })

    expect(result).toStrictEqual({ value: 1 })

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

    const client = createClient<{ POST: { '/test': RequestAction<{ result: {}; body: { foo: number } }> } }>({
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
})