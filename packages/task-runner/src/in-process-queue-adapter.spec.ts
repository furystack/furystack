import { describe, expect, it, vi } from 'vitest'
import { InProcessQueueAdapter } from './in-process-queue-adapter.js'
import type { ClaimOutcome, ClaimedTask, WorkerSubscription } from './queue-adapter.js'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return
    await sleep(5)
  }
  throw new Error(`waitFor: predicate not satisfied within ${timeoutMs}ms`)
}

const makeSub = (
  onClaim: (claim: ClaimedTask) => Promise<ClaimOutcome>,
  over: Partial<WorkerSubscription> = {},
): WorkerSubscription => ({
  workerId: 'w-1',
  concurrency: 1,
  tags: [],
  types: ['t'],
  compatibleVersions: {},
  shouldDrain: () => false,
  onClaim,
  ...over,
})

describe('InProcessQueueAdapter', () => {
  describe('tag matching (F3)', () => {
    it('only claims tasks whose tags the worker satisfies', async () => {
      using adapter = new InProcessQueueAdapter()
      const claimed: string[] = []
      using sub = adapter.subscribe(
        makeSub(
          async (claim) => {
            claimed.push(claim.taskId)
            return { kind: 'success' }
          },
          { tags: ['gpu'] },
        ),
      )
      void sub

      await adapter.enqueue({ taskId: 'needs-gpu', type: 't', handlerVersion: 1, tags: ['gpu'] })
      await adapter.enqueue({ taskId: 'needs-fpga', type: 't', handlerVersion: 1, tags: ['fpga'] })

      await waitFor(() => claimed.includes('needs-gpu'))
      await sleep(40)
      // The fpga task is never claimed by a gpu-only worker.
      expect(claimed).toEqual(['needs-gpu'])
    })

    it('claims an untagged task (no requirements) on any worker', async () => {
      using adapter = new InProcessQueueAdapter()
      const claimed: string[] = []
      using sub = adapter.subscribe(
        makeSub(
          async (claim) => {
            claimed.push(claim.taskId)
            return { kind: 'success' }
          },
          { tags: ['gpu'] },
        ),
      )
      void sub

      await adapter.enqueue({ taskId: 'anyone', type: 't', handlerVersion: 1, tags: [] })
      await waitFor(() => claimed.includes('anyone'))
      expect(claimed).toEqual(['anyone'])
    })
  })

  describe('fleet cap (F4)', () => {
    it('caps concurrent claims per type across a worker\u2019s slots', async () => {
      using adapter = new InProcessQueueAdapter({ concurrencyLimits: { t: 1 } })
      let live = 0
      let max = 0
      let completed = 0
      using sub = adapter.subscribe(
        makeSub(
          async () => {
            live += 1
            max = Math.max(max, live)
            await sleep(40)
            live -= 1
            completed += 1
            return { kind: 'success' }
          },
          { concurrency: 3 },
        ),
      )
      void sub

      for (let i = 0; i < 4; i++) {
        await adapter.enqueue({ taskId: `t${i}`, type: 't', handlerVersion: 1 })
      }

      await waitFor(() => completed === 4, 4000)
      expect(max).toBe(1)
    })

    it('declares fleetCapEnforcement support', () => {
      using adapter = new InProcessQueueAdapter()
      expect(adapter.capabilities.fleetCapEnforcement).toBe(true)
    })

    it('releases one cap slot at a time when multiple of a type run concurrently', async () => {
      using adapter = new InProcessQueueAdapter({ concurrencyLimits: { t: 2 } })
      let live = 0
      let max = 0
      let completed = 0
      using sub = adapter.subscribe(
        makeSub(
          async () => {
            live += 1
            max = Math.max(max, live)
            await sleep(40)
            live -= 1
            completed += 1
            return { kind: 'success' }
          },
          { concurrency: 3 },
        ),
      )
      void sub

      for (let i = 0; i < 3; i++) {
        await adapter.enqueue({ taskId: `t${i}`, type: 't', handlerVersion: 1 })
      }

      // Cap of 2 → two run at once; finishing the first decrements the live
      // counter to 1 (not 0), then the third claims the freed slot.
      await waitFor(() => completed === 3, 4000)
      expect(max).toBe(2)
    })
  })

  describe('slot concurrency', () => {
    it('runs up to `concurrency` claims in parallel when uncapped', async () => {
      using adapter = new InProcessQueueAdapter()
      let live = 0
      let max = 0
      let completed = 0
      using sub = adapter.subscribe(
        makeSub(
          async () => {
            live += 1
            max = Math.max(max, live)
            await sleep(40)
            live -= 1
            completed += 1
            return { kind: 'success' }
          },
          { concurrency: 3 },
        ),
      )
      void sub

      for (let i = 0; i < 6; i++) {
        await adapter.enqueue({ taskId: `t${i}`, type: 't', handlerVersion: 1 })
      }

      await waitFor(() => completed === 6, 4000)
      expect(max).toBe(3)
    })
  })

  describe('onClaim outcomes', () => {
    it('requeues (does not drop) a task when onClaim throws', async () => {
      using adapter = new InProcessQueueAdapter()
      let attempts = 0
      const succeeded: string[] = []
      using sub = adapter.subscribe(
        makeSub(async (claim) => {
          attempts += 1
          if (attempts === 1) throw new Error('onClaim contract violation')
          succeeded.push(claim.taskId)
          return { kind: 'success' }
        }),
      )
      void sub

      await adapter.enqueue({ taskId: 'retry-me', type: 't', handlerVersion: 1 })

      await waitFor(() => succeeded.includes('retry-me'))
      expect(attempts).toBeGreaterThanOrEqual(2)
    })
  })

  describe('idempotency lease TTL (F5)', () => {
    it('returns the existing lease within TTL and a fresh one after it expires', async () => {
      vi.useFakeTimers()
      try {
        using adapter = new InProcessQueueAdapter({ idempotencyTtlSec: 1 })
        expect(await adapter.acquireIdempotencyLease({ type: 't', key: 'k', taskId: 'first' })).toBe('first')
        expect(await adapter.acquireIdempotencyLease({ type: 't', key: 'k', taskId: 'second' })).toBe('first')
        vi.advanceTimersByTime(1001)
        expect(await adapter.acquireIdempotencyLease({ type: 't', key: 'k', taskId: 'third' })).toBe('third')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('delayed dispatch', () => {
    it('claims a task only after its notBefore elapses', async () => {
      using adapter = new InProcessQueueAdapter()
      const claimedAt: number[] = []
      using sub = adapter.subscribe(
        makeSub(async () => {
          claimedAt.push(Date.now())
          return { kind: 'success' }
        }),
      )
      void sub

      const enqueuedAt = Date.now()
      await adapter.enqueue({ taskId: 'soon', type: 't', handlerVersion: 1, notBefore: new Date(enqueuedAt + 40) })

      await waitFor(() => claimedAt.length === 1, 4000)
      expect(claimedAt[0] - enqueuedAt).toBeGreaterThanOrEqual(30)
    })
  })

  describe('disposal', () => {
    it('throws when subscribing after dispose', () => {
      const adapter = new InProcessQueueAdapter()
      adapter[Symbol.dispose]()
      expect(() => adapter.subscribe(makeSub(async () => ({ kind: 'success' })))).toThrow(/disposed/)
    })

    it('clears a pending notBefore timer on dispose', async () => {
      const adapter = new InProcessQueueAdapter()
      // A far-future notBefore arms the scheduler timer; dispose must clear it.
      await adapter.enqueue({ taskId: 'later', type: 't', handlerVersion: 1, notBefore: new Date(Date.now() + 60_000) })
      expect(() => adapter[Symbol.dispose]()).not.toThrow()
    })
  })
})
