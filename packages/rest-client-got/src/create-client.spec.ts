import { createClient } from './'
import { RequestAction } from '@furystack/rest'
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

    const client = createClient<{ GET: { '/test': RequestAction<{ result: { foo: number } }> } }>({
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
    const got: any = jest.fn(async () => ({ value: 1 }))

    const client = createClient<{ GET: { '/test': RequestAction<{ result: { value: number } }> } }>({
      endpointUrl,
      got,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
    })

    expect(result).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test'), { method: 'GET', body: undefined })
  })

  it('Should call a GET request with query parameters', async () => {
    const got: any = jest.fn(async () => ({ value: 1 }))

    const client = createClient<{
      GET: { '/test': RequestAction<{ result: { value: number }; query: { value: string } }> }
    }>({
      endpointUrl,
      got,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
      query: { value: 'asdasd' },
    })

    expect(result).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test?value=asdasd'), {
      method: 'GET',
      body: undefined,
    })
  })

  it('Should call a GET request with URL parameters', async () => {
    const got: any = jest.fn(async () => ({
      value: 1,
    }))

    const client = createClient<{
      GET: { '/test/:urlValue': RequestAction<{ result: { value: number }; url: { urlValue: string } }> }
    }>({
      endpointUrl,
      got,
    })

    const result = await client({
      action: '/test/:urlValue',
      method: 'GET',
      url: { urlValue: 'asd' },
    })

    expect(result).toStrictEqual({ value: 1 })

    expect(got).toBeCalledWith(PathHelper.joinPaths(endpointUrl, 'test/asd'), {
      method: 'GET',
      body: undefined,
    })
  })

  it('Should call a simple POST request with body', async () => {
    const got: any = jest.fn(async () => ({
      ok: true,
    }))

    const client = createClient<{ POST: { '/test': RequestAction<{ result: {}; body: { foo: number } }> } }>({
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

    const client = createClient<{ POST: { '/test': RequestAction<{ result: {}; headers: { token: string } }> } }>({
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
