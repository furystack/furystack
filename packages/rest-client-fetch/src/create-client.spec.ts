import { describe, expect, it, vi } from 'vitest'
import { createClient } from './create-client.js'

const endpointUrl = 'http://localhost'

type fetchType = typeof fetch

globalThis.fetch = (globalThis as { fetch: fetchType }).fetch || ((() => null) as unknown as fetchType)

describe('@furystack/rest-client-fetch', () => {
  it('Should return a method', () => {
    const result = createClient({ endpointUrl, fetch })
    expect(typeof result).toBe('function')
  })

  it('Should create with native Fetch by default', () => {
    const result = createClient({ endpointUrl })
    expect(typeof result).toBe('function')
  })

  it('Should throw if request is not OK', async () => {
    const json = vi.fn(async () => ({ value: 1 }))
    const fetch = vi.fn((async () => ({
      json,
      ok: false,
    })) as unknown as fetchType)

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
    const json = vi.fn(async () => ({ value: 1 }))
    const fetch: any = vi.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ GET: { '/test': { result: { value: number } } } }>({
      endpointUrl,
      fetch: fetch as unknown as fetchType,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(`${endpointUrl}/test`, { method: 'GET', body: undefined })
    expect(json).toBeCalled()
  })

  it('Should call a GET request with query parameters', async () => {
    const json = vi.fn(async () => ({ value: 1 }))
    const fetch: any = vi.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{
      GET: { '/test': { result: { value: number }; query: { value: string } } }
    }>({
      endpointUrl,
      fetch: fetch as unknown as fetchType,
    })

    const result = await client({
      action: '/test',
      method: 'GET',
      query: { value: 'asdasd' },
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(`${endpointUrl}/test?value=ImFzZGFzZCI%253D`, {
      method: 'GET',
      body: undefined,
    })
    expect(json).toBeCalled()
  })

  it('Should call a GET request with URL parameters', async () => {
    const json = vi.fn(async () => ({ value: 1 }))
    const fetch: any = vi.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{
      GET: { '/test/:urlValue': { result: { value: number }; url: { urlValue: string } } }
    }>({
      endpointUrl,
      fetch: fetch as unknown as fetchType,
    })

    const result = await client({
      action: '/test/:urlValue',
      method: 'GET',
      url: { urlValue: 'asd' },
    })

    expect(result.result).toEqual({ value: 1 })

    expect(fetch).toBeCalledWith(`${endpointUrl}/test/asd`, {
      method: 'GET',
      body: undefined,
    })
    expect(json).toBeCalled()
  })

  it('Should call a simple POST request with body', async () => {
    const json = vi.fn(async () => ({}))
    const fetch: any = vi.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ POST: { '/test': { result: object; body: { foo: number } } } }>({
      endpointUrl,
      fetch: fetch as unknown as fetchType,
    })

    await client({
      action: '/test',
      method: 'POST',
      body: { foo: 3 },
    })

    expect(fetch).toBeCalledWith(`${endpointUrl}/test`, {
      method: 'POST',
      body: JSON.stringify({ foo: 3 }),
    })
    expect(json).toBeCalled()
  })

  it('Should call a request with headers', async () => {
    const json = vi.fn(async () => ({}))
    const fetch: any = vi.fn(async () => ({
      json,
      ok: true,
    }))

    const client = createClient<{ POST: { '/test': { result: object; headers: { token: string } } } }>({
      endpointUrl,
      fetch: fetch as unknown as fetchType,
    })

    await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(fetch).toBeCalledWith(`${endpointUrl}/test`, {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(json).toBeCalled()
  })

  it('Should parse a response with text/ headers', async () => {
    const text = vi.fn(async () => 'alma')
    const fetch: any = vi.fn(async () => ({
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
      fetch: fetch as unknown as fetchType,
    })

    const result = await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(result.result).toBe('alma')

    expect(fetch).toBeCalledWith(`${endpointUrl}/test`, {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(text).toBeCalled()
  })

  it('Should parse a response with form/multipart headers', async () => {
    const exampleValue = { foo: 1, bar: 'alma' }
    const formData = vi.fn(async () => exampleValue)
    const fetch: any = vi.fn(async () => ({
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
      fetch: fetch as unknown as fetchType,
    })

    const result = await client({
      action: '/test',
      method: 'POST',
      headers: {
        token: '123',
      },
    })

    expect(result.result).toBe(exampleValue)

    expect(fetch).toBeCalledWith(`${endpointUrl}/test`, {
      method: 'POST',
      headers: {
        token: '123',
      },
    })
    expect(formData).toBeCalled()
  })
})
