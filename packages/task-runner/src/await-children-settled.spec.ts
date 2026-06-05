import { describe, it, expect, afterEach } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { createTestRunner } from './testing/create-test-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'
import type { TestRunner } from './testing/create-test-runner.js'
import type { SettledChildResult } from './task-context.js'
import type { TaskRunner } from './task-runner.js'

const echoHandler = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const flakyHandler = defineTaskHandler<Record<string, never>, never>({
  type: 'flaky',
  version: 1,
  retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
  handler: async () => {
    throw new Error('child boom')
  },
})

const blockerHandler = defineTaskHandler<Record<string, never>, void>({
  type: 'blocker',
  version: 1,
  handler: async (ctx) => {
    await ctx.sleep(60_000)
  },
})

const settledParent = defineTaskHandler<Record<string, never>, { results: SettledChildResult[] }>({
  type: 'settled-parent',
  version: 1,
  handler: async (ctx) => {
    const good = await ctx.spawnChild<{ value: string }, { echoed: string }>('echo', { value: 'ok' })
    const bad = await ctx.spawnChild<Record<string, never>, never>('flaky', {})
    const results = await ctx.awaitChildrenSettled([good, bad])
    return { results }
  },
})

const settledCancelParent = defineTaskHandler<Record<string, never>, { results: SettledChildResult[] }>({
  type: 'settled-cancel-parent',
  version: 1,
  handler: async (ctx) => {
    const h = await ctx.spawnChild<Record<string, never>, void>('blocker', {})
    const results = await ctx.awaitChildrenSettled([h])
    return { results }
  },
})

const settledThenAwaitParent = defineTaskHandler<Record<string, never>, { firstStatus: string; second: string }>({
  type: 'settled-then-await',
  version: 1,
  handler: async (ctx) => {
    const a = await ctx.spawnChild<{ value: string }, { echoed: string }>('echo', { value: 'a' })
    const settled = await ctx.awaitChildrenSettled([a])
    const b = await ctx.spawnChild<{ value: string }, { echoed: string }>('echo', { value: 'b' })
    const [rb] = await ctx.awaitChildren([b])
    return { firstStatus: settled[0].status, second: rb.echoed }
  },
})

const pollFirstChildId = async (runner: TaskRunner, taskId: string, timeoutMs = 5000): Promise<string> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const task = await runner.get(taskId)
    const childId = task?.childTaskIds[0]
    if (childId) return childId
    await new Promise<void>((resolve) => setTimeout(resolve, 25))
  }
  throw new Error(`Task ${taskId} spawned no child within ${timeoutMs}ms`)
}

let tr: TestRunner

afterEach(async () => {
  if (tr) await tr[Symbol.asyncDispose]()
})

describe('TaskContext.awaitChildrenSettled', () => {
  it('resolves with per-child settled results for a success/failure mix', async () => {
    tr = createTestRunner({ handlers: [echoHandler, flakyHandler, settledParent] })
    const task = await tr.runner.submit({ type: 'settled-parent', payload: {}, handlerVersion: 1 })

    const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })

    expect(completed.status).toBe('succeeded')
    expect(completed.result).toMatchObject({
      results: [
        { status: 'succeeded', type: 'echo', result: { echoed: 'ok' } },
        { status: 'failed', type: 'flaky', error: { name: 'Error', message: 'child boom' } },
      ],
    })
  })

  it('maps an externally-cancelled child to status cancelled without rejecting the parent', async () => {
    tr = createTestRunner({ handlers: [blockerHandler, settledCancelParent] })
    const task = await tr.runner.submit({ type: 'settled-cancel-parent', payload: {}, handlerVersion: 1 })

    const childId = await pollFirstChildId(tr.runner, task.id)
    await tr.runner.cancel(childId)

    const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })

    expect(completed.status).toBe('succeeded')
    expect(completed.result).toMatchObject({ results: [{ status: 'cancelled', type: 'blocker' }] })
  })

  it('replays the recorded settled result on a later suspension', async () => {
    tr = createTestRunner({ handlers: [echoHandler, settledThenAwaitParent] })
    const task = await tr.runner.submit({ type: 'settled-then-await', payload: {}, handlerVersion: 1 })

    const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })

    expect(completed.status).toBe('succeeded')
    expect(completed.result).toMatchObject({ firstStatus: 'succeeded', second: 'b' })
  })
})
