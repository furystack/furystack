import { createClient } from './'
import { PathHelper } from '@furystack/utils'

const endpointUrl = 'http://localhost'

describe('@furystack/rest-client-got', () => {
  it('Should return a method', () => {
    const result = createClient({ endpointUrl, got: (() => undefined) as any })
    expect(typeof result).toBe('function')
  })

  it('Should throw if request is not OK', async () => {
    const got: any = jest.fn(async () => {
      throw Error('Something is wrong...')
    })

    const client = createClient<{ '/test': { GET: { result: { foo: number } } } }>({
      endpointUrl,
      got,
    })

    await expect(
      client({
        action: '/test',
        method: 'GET',
      }),
    ).rejects.toThrow('')
  })

  it('Should call a simple GET request', async () => {
    const got: any = jest.fn(async () => ({ body: JSON.stringify({ value: 1 }) }))

    const client = createClient<{ '/test': { GET: { result: { value: number } } } }>({
      endpointUrl,
      got,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
    })

    expect(result.getJson()).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), { method: 'GET', body: undefined })
  })

  it('Should call a GET request with query parameters', async () => {
    const got: any = jest.fn(async () => ({ body: JSON.stringify({ value: 1 }) }))
    const client = createClient<{
      '/test': { GET: { result: { value: number }; query: { value: string } } }
    }>({
      endpointUrl,
      got,
    })

    const result = await client({
      method: 'GET',
      action: '/test',
      query: { value: 'asdasd' },
    })

    expect(result.getJson()).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test?value=asdasd'), {
      method: 'GET',
      body: undefined,
    })
  })

  it('Should call a GET request with URL parameters', async () => {
    const got: any = jest.fn(async () => ({ body: JSON.stringify({ value: 1 }) }))

    const client = createClient<{
      '/test/:urlValue': { GET: { result: { value: number }; url: { urlValue: string } } }
    }>({
      endpointUrl,
      got,
    })

    const result = await client({
      action: '/test/:urlValue',
      method: 'GET',
      url: { urlValue: 'asd' },
    })

    expect(result.getJson()).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test/asd'), {
      method: 'GET',
      body: undefined,
    })
  })

  it('Should call a simple POST request with body', async () => {
    const got: any = jest.fn(async () => ({
      ok: true,
    }))

    const client = createClient<{ '/test': { POST: { result: {}; body: { foo: number } } } }>({
      endpointUrl,
      got,
    })

    await client({
      action: '/test',
      method: 'POST',
      body: { foo: 3 },
    })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      body: JSON.stringify({ foo: 3 }),
    })
  })

  it('Should call a request with headers', async () => {
    const got: any = jest.fn(async () => ({
      ok: true,
    }))

    const client = createClient<{ '/test': { POST: { result: {}; headers: { token: string } } } }>({
      endpointUrl,
      got,
    })

    await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
  })
})
