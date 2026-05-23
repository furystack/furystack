import { describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { RedisQueueAdapter } from './redis-queue-adapter.js'

// `vi.fn()` without generics returns `MockInstance<(...args: any[]) => any>`,
// which is the most permissive MockInstance and matches the loose redis
// client surface — typing each method tightly here would force every
// stub to ape the real `redis` client signatures, which is not what
// these unit tests care about.
type AnyMock = MockInstance<(...args: never[]) => unknown>

type MockClient = {
  xAdd: AnyMock
  xGroupCreate: AnyMock
  xReadGroup: AnyMock
  xAutoClaim: AnyMock
  xAck: AnyMock
  xClaimJustId: AnyMock
  set: AnyMock
  get: AnyMock
  zAdd: AnyMock
  eval: AnyMock
}

/**
 * Default mocks for the redis client. `xReadGroup` simulates BLOCK
 * by awaiting `opts.BLOCK` ms before resolving — without this the
 * slot loop spins as fast as possible and `mock.calls` accumulates
 * unbounded (OOMs vitest).
 */
const buildClient = (overrides: Partial<MockClient> = {}): MockClient => ({
  xAdd: vi.fn().mockResolvedValue('1-0'),
  xGroupCreate: vi.fn().mockResolvedValue('OK'),
  xReadGroup: vi.fn().mockImplementation(async (_g, _c, _streams, opts?: { BLOCK?: number }) => {
    if (opts?.BLOCK) await new Promise<void>((r) => setTimeout(r, opts.BLOCK))
    return null
  }),
  xAutoClaim: vi.fn().mockImplementation(async () => {
    await new Promise<void>((r) => setTimeout(r, 1))
    return { nextId: '0-0', messages: [] }
  }),
  xAck: vi.fn().mockResolvedValue(1),
  xClaimJustId: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(null),
  zAdd: vi.fn().mockResolvedValue(1),
  eval: vi.fn().mockResolvedValue(0),
  ...overrides,
})

const makeAdapter = (client: MockClient, prefix = 'svc-a/', schedulerIntervalMs = 1_000_000): RedisQueueAdapter => {
  return new RedisQueueAdapter({
    client: client as unknown as ConstructorParameters<typeof RedisQueueAdapter>[0]['client'],
    serviceName: 'svc-a',
    topicPrefix: prefix,
    blockTimeoutMs: 5,
    retryBackoffMs: 5,
    // Disable the auto-tick by default — tests that exercise the
    // scheduler trigger it manually via internal test hooks. A huge
    // value keeps `setInterval` cheap without rewriting timer plumbing.
    schedulerIntervalMs,
  })
}

describe('RedisQueueAdapter', () => {
  describe('capabilities', () => {
    it('declares persistent + distributed + brokerSideReclaim + delayedDispatch', () => {
      using adapter = makeAdapter(buildClient())
      expect(adapter.capabilities.persistent).toBe(true)
      expect(adapter.capabilities.distributed).toBe(true)
      expect(adapter.capabilities.brokerSideReclaim).toBe(true)
      expect(adapter.capabilities.delayedDispatch).toBe(true)
    })

    it('flags fleetCapEnforcement as not supported in this revision', () => {
      using adapter = makeAdapter(buildClient())
      expect(adapter.capabilities.fleetCapEnforcement).toBe(false)
    })
  })

  describe('enqueue', () => {
    it('writes to per-(type,version) stream with the documented field shape', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      await adapter.enqueue({ taskId: 'task-1', type: 'video-encode', handlerVersion: 2 })

      expect(client.xGroupCreate).toHaveBeenCalledWith('svc-a/tasks:queue:video-encode:v2', 'runner', '$', {
        MKSTREAM: true,
      })
      expect(client.xAdd).toHaveBeenCalledWith('svc-a/tasks:queue:video-encode:v2', '*', {
        taskId: 'task-1',
        type: 'video-encode',
        handlerVersion: '2',
      })
    })

    it('caches consumer-group creation per stream', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      await adapter.enqueue({ taskId: 't1', type: 'echo', handlerVersion: 1 })
      await adapter.enqueue({ taskId: 't2', type: 'echo', handlerVersion: 1 })

      expect(client.xGroupCreate).toHaveBeenCalledTimes(1)
      expect(client.xAdd).toHaveBeenCalledTimes(2)
    })

    it('tolerates BUSYGROUP errors when the consumer group already exists', async () => {
      const client = buildClient({
        xGroupCreate: vi.fn().mockRejectedValue(new Error('BUSYGROUP Consumer Group name already exists')),
      })
      using adapter = makeAdapter(client)
      await expect(adapter.enqueue({ taskId: 't1', type: 'echo', handlerVersion: 1 })).resolves.toBeUndefined()
      expect(client.xAdd).toHaveBeenCalledOnce()
    })
  })

  describe('delayed dispatch', () => {
    it('ZADDs to the scheduler ZSET when notBefore is in the future', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      const future = new Date(Date.now() + 60_000)
      await adapter.enqueue({ taskId: 't1', type: 'echo', handlerVersion: 1, notBefore: future })

      expect(client.xAdd).not.toHaveBeenCalled()
      expect(client.zAdd).toHaveBeenCalledWith('svc-a/tasks:scheduler', {
        score: future.getTime(),
        value: JSON.stringify({ taskId: 't1', type: 'echo', handlerVersion: 1 }),
      })
    })

    it('XADDs immediately when notBefore is in the past', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      await adapter.enqueue({
        taskId: 't1',
        type: 'echo',
        handlerVersion: 1,
        notBefore: new Date(Date.now() - 1000),
      })
      expect(client.zAdd).not.toHaveBeenCalled()
      expect(client.xAdd).toHaveBeenCalledOnce()
    })

    it('eagerly creates the consumer group on the destination stream so scheduler XADDs are not lost', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      await adapter.enqueue({
        taskId: 't1',
        type: 'echo',
        handlerVersion: 1,
        notBefore: new Date(Date.now() + 60_000),
      })
      expect(client.xGroupCreate).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', 'runner', '$', {
        MKSTREAM: true,
      })
    })

    it('runs the scheduler tick on the configured interval and EVALs the dispatch script', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client, 'svc-a/', 20)
      // Block until at least one tick fired against the broker.
      await waitFor(() => client.eval.mock.calls.length > 0, 500)
      const firstCall = client.eval.mock.calls[0] as unknown as [string, { keys: string[]; arguments: string[] }]
      const opts = firstCall[1]
      expect(opts.keys).toEqual(['svc-a/tasks:scheduler'])
      expect(opts.arguments[2]).toBe('svc-a/')
      // ARGV[1] is `now` epoch ms; sanity-check it parses.
      expect(Number.isFinite(Number(opts.arguments[0]))).toBe(true)
      // ARGV[2] is the batch limit — must be a positive integer.
      expect(Number(opts.arguments[1])).toBeGreaterThan(0)
      void adapter
    })

    it('swallows EVAL errors so a transient broker failure does not poison the timer', async () => {
      const errors: unknown[] = []
      const client = buildClient({
        eval: vi.fn().mockImplementation(() => {
          const error = new Error('LOADING Redis is starting')
          errors.push(error)
          throw error
        }),
      })
      using adapter = makeAdapter(client, 'svc-a/', 10)
      await waitFor(() => errors.length >= 2, 500)
      void adapter
    })
  })

  describe('acquireIdempotencyLease', () => {
    it('returns own taskId when SET NX wins the race', async () => {
      const client = buildClient({ set: vi.fn().mockResolvedValue('OK') })
      using adapter = makeAdapter(client)
      const winner = await adapter.acquireIdempotencyLease({ type: 'echo', key: 'nightly', taskId: 'mine' })
      expect(winner).toBe('mine')
      expect(client.set).toHaveBeenCalledWith('svc-a/tasks:idem:echo:nightly', 'mine', {
        NX: true,
        EX: 86_400,
      })
    })

    it('returns the stored taskId when SET NX loses', async () => {
      const client = buildClient({
        set: vi.fn().mockResolvedValue(null),
        get: vi.fn().mockResolvedValue('previous'),
      })
      using adapter = makeAdapter(client)
      const winner = await adapter.acquireIdempotencyLease({ type: 'echo', key: 'nightly', taskId: 'mine' })
      expect(winner).toBe('previous')
    })

    it('falls back to own taskId when SET loses but GET sees no value (TTL expired between calls)', async () => {
      const client = buildClient({
        set: vi.fn().mockResolvedValue(null),
        get: vi.fn().mockResolvedValue(null),
      })
      using adapter = makeAdapter(client)
      const winner = await adapter.acquireIdempotencyLease({ type: 'echo', key: 'nightly', taskId: 'mine' })
      expect(winner).toBe('mine')
    })
  })

  describe('heartbeat', () => {
    it('XCLAIMs the message id with idle=0 to refresh PEL idle counter', async () => {
      const client = buildClient()
      using adapter = makeAdapter(client)
      await adapter.heartbeat({
        taskId: 't1',
        type: 'echo',
        receipt: { stream: 'svc-a/tasks:queue:echo:v1', msgId: '1-0', consumer: 'w-0', deliveryCount: 0 },
      })
      expect(client.xClaimJustId).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', 'runner', 'w-0', 0, ['1-0'])
    })

    it('swallows broker errors so transient failures do not bubble into handler land', async () => {
      const client = buildClient({
        xClaimJustId: vi.fn().mockRejectedValue(new Error('connection lost')),
      })
      using adapter = makeAdapter(client)
      await expect(
        adapter.heartbeat({
          taskId: 't1',
          type: 'echo',
          receipt: { stream: 'svc-a/tasks:queue:echo:v1', msgId: '1-0', consumer: 'w-0', deliveryCount: 0 },
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('subscribe — claim loop', () => {
    it('reads from per-(type,version) streams matching compatibleVersions', async () => {
      const seenStreams: string[][] = []
      const client = buildClient({
        xReadGroup: vi.fn().mockImplementation((_g, _c, streams: Array<{ key: string }>) => {
          seenStreams.push(streams.map((s) => s.key))
          return Promise.resolve(null)
        }),
      })
      using adapter = makeAdapter(client)
      const onClaim = vi.fn().mockResolvedValue({ kind: 'success' })
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['video-encode'],
        compatibleVersions: { 'video-encode': [1, 2] },
        shouldDrain: () => false,
        onClaim,
      })
      void sub

      await waitFor(() => seenStreams.length > 0, 500)
      expect(seenStreams[0]?.sort()).toEqual(['svc-a/tasks:queue:video-encode:v1', 'svc-a/tasks:queue:video-encode:v2'])
    })

    it('defaults to v1 stream when compatibleVersions for a type is missing', async () => {
      const seenStreams: string[][] = []
      const client = buildClient({
        xReadGroup: vi.fn().mockImplementation((_g, _c, streams: Array<{ key: string }>) => {
          seenStreams.push(streams.map((s) => s.key))
          return Promise.resolve(null)
        }),
      })
      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: {},
        shouldDrain: () => false,
        onClaim: vi.fn().mockResolvedValue({ kind: 'success' }),
      })
      void sub

      await waitFor(() => seenStreams.length > 0, 500)
      expect(seenStreams[0]).toEqual(['svc-a/tasks:queue:echo:v1'])
    })

    it('delivers a claim and ACKs on success', async () => {
      const claims: Array<{ taskId: string; type: string }> = []
      const onClaim = vi.fn().mockImplementation((claim: { taskId: string; type: string }) => {
        claims.push({ taskId: claim.taskId, type: claim.type })
        return Promise.resolve({ kind: 'success' })
      })
      const xReadGroup = oneShotXReadGroup({
        stream: 'svc-a/tasks:queue:echo:v1',
        message: { id: '1-0', fields: { taskId: 't1', type: 'echo', handlerVersion: '1' } },
      })
      const client = buildClient({ xReadGroup })

      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: { echo: [1] },
        shouldDrain: () => false,
        onClaim,
      })
      void sub

      await waitFor(() => claims.length > 0, 1000)
      expect(claims[0]).toEqual({ taskId: 't1', type: 'echo' })
      await waitFor(() => client.xAck.mock.calls.length > 0, 1000)
      expect(client.xAck).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', 'runner', '1-0')
    })

    it('ACKs the original entry and re-XADDs when onClaim returns requeue', async () => {
      const xReadGroup = oneShotXReadGroup({
        stream: 'svc-a/tasks:queue:echo:v1',
        message: { id: '1-0', fields: { taskId: 't1', type: 'echo', handlerVersion: '1' } },
      })
      const client = buildClient({ xReadGroup })
      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: { echo: [1] },
        shouldDrain: () => false,
        onClaim: vi.fn().mockResolvedValue({ kind: 'requeue' }),
      })
      void sub

      await waitFor(() => client.xAck.mock.calls.length > 0, 1000)
      await waitFor(() => client.xAdd.mock.calls.length > 0, 1000)
      expect(client.xAck).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', 'runner', '1-0')
      expect(client.xAdd).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', '*', {
        taskId: 't1',
        type: 'echo',
        handlerVersion: '1',
      })
    })

    it('runs XAUTOCLAIM and delivers the reclaimed entry through onClaim', async () => {
      const claims: Array<{ taskId: string; type: string }> = []
      let autoClaimCall = 0
      const xAutoClaim = vi.fn().mockImplementation(async () => {
        autoClaimCall += 1
        await new Promise<void>((r) => setTimeout(r, 1))
        if (autoClaimCall === 1) {
          return {
            nextId: '2-0',
            messages: [{ id: '1-0', message: { taskId: 't-stale', type: 'echo', handlerVersion: '1' } }],
          }
        }
        return { nextId: '0-0', messages: [] }
      })
      const client = buildClient({ xAutoClaim })
      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: { echo: [1] },
        shouldDrain: () => false,
        onClaim: vi.fn().mockImplementation((claim: { taskId: string; type: string }) => {
          claims.push({ taskId: claim.taskId, type: claim.type })
          return Promise.resolve({ kind: 'success' })
        }),
      })
      void sub

      await waitFor(() => claims.length > 0, 1000)
      expect(claims[0]).toEqual({ taskId: 't-stale', type: 'echo' })
    })

    it('drops malformed entries (missing taskId) without invoking onClaim', async () => {
      const onClaim = vi.fn()
      const xReadGroup = oneShotXReadGroup({
        stream: 'svc-a/tasks:queue:echo:v1',
        message: { id: '1-0', fields: { type: 'echo' } },
      })
      const client = buildClient({ xReadGroup })
      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: { echo: [1] },
        shouldDrain: () => false,
        onClaim,
      })
      void sub

      await waitFor(() => client.xAck.mock.calls.length > 0, 1000)
      expect(onClaim).not.toHaveBeenCalled()
      expect(client.xAck).toHaveBeenCalledWith('svc-a/tasks:queue:echo:v1', 'runner', '1-0')
    })

    it('stops the slot loop when subscription.shouldDrain() flips to true', async () => {
      let draining = false
      const xReadGroup = vi.fn().mockResolvedValue(null)
      const client = buildClient({ xReadGroup })
      using adapter = makeAdapter(client)
      using sub = adapter.subscribe({
        workerId: 'w-1',
        concurrency: 1,
        types: ['echo'],
        compatibleVersions: { echo: [1] },
        shouldDrain: () => draining,
        onClaim: vi.fn().mockResolvedValue({ kind: 'success' }),
      })
      void sub

      await waitFor(() => xReadGroup.mock.calls.length > 0, 500)
      const callsBefore = xReadGroup.mock.calls.length
      draining = true
      await new Promise<void>((r) => setTimeout(r, 80))
      const callsAfter = xReadGroup.mock.calls.length
      // The loop may issue one or two more reads before observing the drain
      // signal between iterations; what matters is that it stops growing.
      await new Promise<void>((r) => setTimeout(r, 50))
      const callsAfterSettle = xReadGroup.mock.calls.length
      expect(callsAfter).toBeLessThanOrEqual(callsBefore + 4)
      expect(callsAfterSettle).toBeLessThanOrEqual(callsAfter + 1)
    })
  })
})

const waitFor = async (predicate: () => boolean, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return
    await new Promise<void>((r) => setTimeout(r, 5))
  }
  throw new Error(`waitFor: predicate did not satisfy within ${timeoutMs}ms`)
}

/**
 * Returns an `xReadGroup` mock that yields `message` exactly once on
 * the first call, then returns `null` on every subsequent call (with
 * the BLOCK delay simulated so the slot loop paces itself and
 * `mock.calls` does not grow unbounded).
 */
const oneShotXReadGroup = (delivery: {
  stream: string
  message: { id: string; fields: Record<string, string> }
}): AnyMock => {
  let delivered = false
  return vi.fn().mockImplementation(async (_g, _c, _streams, opts?: { BLOCK?: number }) => {
    if (!delivered) {
      delivered = true
      return [
        {
          name: delivery.stream,
          messages: [{ id: delivery.message.id, message: delivery.message.fields }],
        },
      ]
    }
    if (opts?.BLOCK) await new Promise<void>((r) => setTimeout(r, opts.BLOCK))
    return null
  })
}
