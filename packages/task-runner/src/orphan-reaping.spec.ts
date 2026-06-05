import { describe, it, expect, afterEach } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { createTestRunner } from './testing/create-test-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'
import type { TestRunner } from './testing/create-test-runner.js'

const echoHandler = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const blockerHandler = defineTaskHandler<Record<string, never>, void>({
  type: 'blocker',
  version: 1,
  handler: async (ctx) => {
    await ctx.sleep(60_000)
  },
})

const spawnAndForgetSuccess = defineTaskHandler<Record<string, never>, { done: true }>({
  type: 'spawn-and-forget-success',
  version: 1,
  handler: async (ctx) => {
    await ctx.spawnChild<Record<string, never>, void>('blocker', {})
    return { done: true }
  },
})

const spawnThenFail = defineTaskHandler<Record<string, never>, never>({
  type: 'spawn-then-fail',
  version: 1,
  retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
  handler: async (ctx) => {
    await ctx.spawnChild<Record<string, never>, void>('blocker', {})
    throw new Error('parent boom')
  },
})

const retrySpawn = defineTaskHandler<Record<string, never>, { echoed: string }>({
  type: 'retry-spawn',
  version: 1,
  retryPolicy: { maxAttempts: 2, backoff: 'none', baseDelayMs: 0, jitter: 0 },
  handler: async (ctx) => {
    const h = await ctx.spawnChild<{ value: string }, { echoed: string }>('echo', { value: 'survive' })
    if (ctx.attempt === 1) throw new Error('first attempt fails')
    const [r] = await ctx.awaitChildren([h])
    return { echoed: r.echoed }
  },
})

let tr: TestRunner

afterEach(async () => {
  if (tr) await tr[Symbol.asyncDispose]()
})

describe('orphan reaping (open question #2)', () => {
  it('cancels a child spawned-without-await when the parent succeeds', async () => {
    tr = createTestRunner({ handlers: [blockerHandler, spawnAndForgetSuccess] })
    const task = await tr.runner.submit({ type: 'spawn-and-forget-success', payload: {}, handlerVersion: 1 })

    const parent = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
    expect(parent.status).toBe('succeeded')

    const childId = parent.childTaskIds[0]
    expect(childId).toBeTruthy()
    const child = await runTaskToCompletion({ runner: tr.runner, taskId: childId, timeoutMs: 5000 })
    expect(child.status).toBe('cancelled')
  })

  it('cancels still-active children on final parent failure', async () => {
    tr = createTestRunner({ handlers: [blockerHandler, spawnThenFail] })
    const task = await tr.runner.submit({ type: 'spawn-then-fail', payload: {}, handlerVersion: 1 })

    const parent = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
    expect(parent.status).toBe('failed')

    const childId = parent.childTaskIds[0]
    expect(childId).toBeTruthy()
    const child = await runTaskToCompletion({ runner: tr.runner, taskId: childId, timeoutMs: 5000 })
    expect(child.status).toBe('cancelled')
  })

  it('does not reap on a retryable failure — the child survives to the next attempt', async () => {
    tr = createTestRunner({ handlers: [echoHandler, retrySpawn] })
    const task = await tr.runner.submit({ type: 'retry-spawn', payload: {}, handlerVersion: 1 })

    const parent = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
    expect(parent.status).toBe('succeeded')
    expect(parent.result).toMatchObject({ echoed: 'survive' })

    const childId = parent.childTaskIds[0]
    const child = await tr.runner.get(childId)
    expect(child?.status).toBe('succeeded')
  })
})
