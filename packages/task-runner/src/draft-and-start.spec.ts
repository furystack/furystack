import { describe, it, expect, afterEach } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { createTestRunner, type TestRunner } from './testing/create-test-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'

const echoHandler = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

let tr: TestRunner

afterEach(async () => {
  if (tr) await tr[Symbol.asyncDispose]()
})

describe('InProcessTaskRunner — draft/start', () => {
  it('creates a draft task in `draft` status without enqueueing', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })

    const draft = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'placeholder' },
      handlerVersion: 1,
    })

    expect(draft.status).toBe('draft')

    await new Promise<void>((r) => setTimeout(r, 50))
    const stillDraft = await tr.runner.get(draft.id)
    expect(stillDraft?.status).toBe('draft')
  })

  it('start() flips draft to pending and dispatches', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })

    const draft = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'first' },
      handlerVersion: 1,
    })

    const started = await tr.runner.start(draft.id)
    expect(started.status).toBe('pending')

    const completed = await runTaskToCompletion({ runner: tr.runner, taskId: draft.id })
    expect(completed.status).toBe('succeeded')
    expect(completed.result).toEqual({ echoed: 'first' })
  })

  it('start() replaces the payload when provided', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })

    const draft = await tr.runner.draft<{ value: string }>({
      type: 'echo',
      payload: { value: 'placeholder' },
      handlerVersion: 1,
    })

    await tr.runner.start<{ value: string }>(draft.id, { payload: { value: 'final' } })

    const completed = await runTaskToCompletion({ runner: tr.runner, taskId: draft.id })
    expect(completed.result).toEqual({ echoed: 'final' })
  })

  it('start() rejects non-draft tasks', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })
    const task = await tr.runner.submit({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })

    await expect(tr.runner.start(task.id)).rejects.toThrow(/cannot be started/)
  })

  it('start() rejects an unknown task id', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })
    await expect(tr.runner.start('does-not-exist')).rejects.toThrow(/not found/)
  })

  it('cancel() on a draft transitions it to cancelled without dispatch', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })

    const draft = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'x' },
      handlerVersion: 1,
    })

    await tr.runner.cancel(draft.id, 'never started')

    const final = await tr.runner.get(draft.id)
    expect(final?.status).toBe('cancelled')
  })

  it('idempotency key applies to draft() too', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })
    const a = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'a' },
      handlerVersion: 1,
      idempotencyKey: 'dup',
    })
    const b = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'b' },
      handlerVersion: 1,
      idempotencyKey: 'dup',
    })
    expect(a.id).toBe(b.id)
  })

  it('captures submittedBy on the persisted task', async () => {
    tr = createTestRunner({ handlers: [echoHandler] })
    const draft = await tr.runner.draft({
      type: 'echo',
      payload: { value: 'x' },
      handlerVersion: 1,
      submittedBy: 'alice',
    })
    expect(draft.submittedBy).toBe('alice')
  })
})
