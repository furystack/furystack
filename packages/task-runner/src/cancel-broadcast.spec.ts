import { describe, it, expect, afterEach } from 'vitest'
import { CrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import { defineTaskHandler } from './define-task-handler.js'
import { createTestRunner, type TestRunner } from './testing/create-test-runner.js'
import type { TaskUpdate } from './types.js'

const echoHandler = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const longHandler = defineTaskHandler<Record<string, never>, void>({
  type: 'long',
  version: 1,
  handler: async (ctx) => {
    await ctx.sleep(60_000)
  },
})

let tr: TestRunner

afterEach(async () => {
  if (tr) await tr[Symbol.asyncDispose]()
})

describe('InProcessTaskRunner — bus topic surface', () => {
  it('publishes progress on `tasks/progress/${type}` and status on `tasks/status/${type}`', async () => {
    const progressHandler = defineTaskHandler<Record<string, never>, void>({
      type: 'progress-emitter',
      version: 1,
      progressThrottleMs: 0,
      handler: async (ctx) => {
        ctx.reportProgress({ percent: 50 })
        ctx.reportProgress({ percent: 100 })
      },
    })

    tr = createTestRunner({ handlers: [progressHandler] })
    const bus = tr.injector.get(CrossNodeBus)

    const progressTopicMessages: TaskUpdate[] = []
    const statusTopicMessages: TaskUpdate[] = []

    using _p = bus.subscribe('tasks/progress/progress-emitter', (m: BusMessage) => {
      progressTopicMessages.push(m.payload as TaskUpdate)
    })
    using _s = bus.subscribe('tasks/status/progress-emitter', (m: BusMessage) => {
      statusTopicMessages.push(m.payload as TaskUpdate)
    })

    const task = await tr.runner.submit({ type: 'progress-emitter', payload: {}, handlerVersion: 1 })

    // Wait for terminal state.
    await new Promise<void>((resolve) => {
      const sub = tr.runner.subscribe(task.id, (e) => {
        if (e.kind === 'status' && (e.status === 'succeeded' || e.status === 'failed')) {
          sub[Symbol.dispose]()
          resolve()
        }
      })
    })

    expect(progressTopicMessages.every((u) => u.kind === 'progress')).toBe(true)
    expect(progressTopicMessages.length).toBeGreaterThan(0)

    expect(statusTopicMessages.every((u) => u.kind !== 'progress')).toBe(true)
    expect(statusTopicMessages.some((u) => u.kind === 'status' && u.status === 'succeeded')).toBe(true)
  })

  it('publishes a `tasks/cancel/${type}` broadcast carrying the cancelled task ids', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })
    const bus = tr.injector.get(CrossNodeBus)

    const cancelMessages: BusMessage[] = []
    using _c = bus.subscribe('tasks/cancel/echo', (m: BusMessage) => {
      cancelMessages.push(m)
    })

    const task = await tr.runner.draft({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })
    await tr.runner.cancel(task.id, 'no longer needed')

    expect(cancelMessages).toHaveLength(1)
    const payload = cancelMessages[0].payload as { taskIds: string[] }
    expect(payload.taskIds).toContain(task.id)
  })

  it('worker subscribes to `tasks/cancel/${type}` and aborts active leases on broadcast', async () => {
    tr = createTestRunner({ handlers: [longHandler] })
    const bus = tr.injector.get(CrossNodeBus)

    const task = await tr.runner.submit({ type: 'long', payload: {}, handlerVersion: 1 })

    // Wait for the worker to claim the task.
    await new Promise<void>((r) => setTimeout(r, 50))
    expect(tr.worker?.activeTaskCount).toBe(1)

    // Externally publish the cancel topic — simulating a peer node firing it.
    // The runner should NOT have been told to cancel via runner.cancel(); only
    // the bus subscription path is exercised here.
    await bus.publish('tasks/cancel/long', { taskIds: [task.id] })

    // The worker's bus handler aborts the in-flight signal; sleep() rejects;
    // the task transitions to failed (sleep is recorded as a replay step but
    // the abort surfaces as an AbortError → handler retries are exhausted).
    // We verify the abort took effect by waiting for the task to leave running.
    const final = await new Promise<{ status: string }>((resolve) => {
      const start = Date.now()
      const tick = () => {
        void tr.runner.get(task.id).then((t) => {
          if (!t) return
          if (t.status !== 'running' && t.status !== 'claimed' && t.status !== 'pending') {
            resolve({ status: t.status })
            return
          }
          if (Date.now() - start > 2000) {
            resolve({ status: t.status })
            return
          }
          setTimeout(tick, 20)
        })
      }
      tick()
    })

    expect(['cancelled', 'failed', 'cancelling']).toContain(final.status)
  })
})
