import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { collectStream, normalizePutInput } from './normalize-put-input.js'

const decode = (data: Uint8Array): string => new TextDecoder().decode(data)

describe('normalizePutInput', () => {
  it('wraps a Buffer as a single-chunk stream', async () => {
    const stream = normalizePutInput(Buffer.from('hello'))
    expect(decode(await collectStream(stream))).toBe('hello')
  })

  it('wraps a Uint8Array as a single-chunk stream', async () => {
    const stream = normalizePutInput(new Uint8Array([104, 105]))
    expect(decode(await collectStream(stream))).toBe('hi')
  })

  it('returns a Web ReadableStream as-is (passes data through)', async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('a-'))
        controller.enqueue(new TextEncoder().encode('b'))
        controller.close()
      },
    })
    const stream = normalizePutInput(source)
    expect(decode(await collectStream(stream))).toBe('a-b')
  })

  it('bridges a Node Readable into a Web ReadableStream', async () => {
    const stream = normalizePutInput(Readable.from(['n-', 'o-', 'de']))
    expect(decode(await collectStream(stream))).toBe('n-o-de')
  })

  it('copies Buffer input so caller mutations do not bleed through', async () => {
    const buf = Buffer.from('orig')
    const stream = normalizePutInput(buf)
    buf.write('XXXX')
    expect(decode(await collectStream(stream))).toBe('orig')
  })

  it('propagates Node-stream errors via the Web stream', async () => {
    const erroring = new Readable({
      read() {
        this.destroy(new Error('boom'))
      },
    })
    const stream = normalizePutInput(erroring)
    await expect(collectStream(stream)).rejects.toThrow(/boom/)
  })

  it('accepts ArrayBuffer-view chunks (DataView, typed arrays) from a Node stream', async () => {
    const inner = new Uint8Array([1, 2, 3, 4])
    const view = new DataView(inner.buffer, 1, 2)
    const stream = normalizePutInput(Readable.from([view]))
    expect(await collectStream(stream)).toEqual(new Uint8Array([2, 3]))
  })

  it('accepts plain-array chunks (number[]) from a Node stream', async () => {
    const stream = normalizePutInput(Readable.from([[10, 20, 30]]))
    expect(await collectStream(stream)).toEqual(new Uint8Array([10, 20, 30]))
  })

  it('errors on unsupported chunk shapes', async () => {
    const stream = normalizePutInput(Readable.from([{ unsupported: true }]))
    await expect(collectStream(stream)).rejects.toThrow(/Unsupported Node stream chunk/)
  })

  it('skips null/undefined chunks emitted by a Node stream', async () => {
    const node = new Readable({
      read() {
        this.push('keep')
        this.push(null)
      },
    })
    const stream = normalizePutInput(node)
    expect(decode(await collectStream(stream))).toBe('keep')
  })

  it('destroys the underlying Node stream on cancel', async () => {
    const node = Readable.from(['a', 'b', 'c'])
    const stream = normalizePutInput(node)
    await stream.cancel(new Error('caller-cancel'))
    expect(node.destroyed).toBe(true)
  })

  it('cancels gracefully when the node stream lacks destroy()', async () => {
    const fakeStream: NodeJS.ReadableStream = {
      on: () => fakeStream,
      once: () => fakeStream,
      removeListener: () => fakeStream,
      addListener: () => fakeStream,
      removeAllListeners: () => fakeStream,
      emit: () => true,
      eventNames: () => [],
      getMaxListeners: () => 0,
      listenerCount: () => 0,
      listeners: () => [],
      off: () => fakeStream,
      prependListener: () => fakeStream,
      prependOnceListener: () => fakeStream,
      rawListeners: () => [],
      setMaxListeners: () => fakeStream,
      pipe: <T extends NodeJS.WritableStream>(dest: T) => dest,
      read: (): string | Buffer => '',
      isPaused: () => false,
      pause: () => fakeStream,
      resume: () => fakeStream,
      setEncoding: () => fakeStream,
      unpipe: () => fakeStream,
      unshift: () => undefined,
      wrap: () => fakeStream,
      readable: true,
      async *[Symbol.asyncIterator]() {},
    }
    const stream = normalizePutInput(fakeStream)
    await expect(stream.cancel()).resolves.toBeUndefined()
  })
})

describe('collectStream', () => {
  it('drains an empty stream to a zero-length array', async () => {
    const empty = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close()
      },
    })
    const out = await collectStream(empty)
    expect(out.byteLength).toBe(0)
  })

  it('concatenates multiple chunks in order', async () => {
    const chunks = ['one', 'two', 'three']
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(new TextEncoder().encode(c))
        controller.close()
      },
    })
    expect(decode(await collectStream(stream))).toBe('onetwothree')
  })
})
