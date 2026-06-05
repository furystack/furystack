import { describe, expect, it } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { resolveAwaitChildren, resolveAwaitChildrenSettled, type AwaitChildrenDeps } from './await-children.js'
import { isSuspendedError } from './suspended-error.js'
import { TaskDataSet } from './task-data-set.js'
import type { ChildHandle } from './child-handle.js'
import type { ReplayIndex } from './replay-index.js'
import { Task, type TaskReplayLogEntry, type TaskStatus } from './types.js'

let counter = 0

const seedChild = async (
  ds: DataSet<Task, 'id'>,
  injector: Injector,
  status: TaskStatus,
  extra: Partial<Task> = {},
): Promise<ChildHandle<unknown>> => {
  const id = `child-${++counter}`
  const task: Task = Object.assign(new Task(), {
    id,
    type: 'scan',
    handlerVersion: 1,
    status,
    payload: {},
    childTaskIds: [],
    submittedAt: new Date().toISOString(),
    attempts: [],
    events: [],
    producedBlobs: [],
    consumedBlobs: [],
    retentionPolicy: { onSuccess: 'keep', onFailure: 'keep', ttlAfterTerminalDays: 1 },
    tags: [],
    ...extra,
  })
  await ds.add(injector, task)
  return { taskId: id, type: 'scan' }
}

const makeDeps = (
  injector: Injector,
  ds: DataSet<Task, 'id'>,
  allTerminal: boolean,
  recorded: TaskReplayLogEntry[],
): AwaitChildrenDeps => ({
  taskId: 'parent-1',
  injector,
  taskDs: ds,
  allChildrenTerminal: async () => allTerminal,
  persistReplayEntry: async (entry) => {
    recorded.push(entry)
  },
})

describe('await-children', () => {
  describe('resolveAwaitChildren (throwing variant)', () => {
    it('returns child results in order and records the step', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'succeeded', { result: 'A' })
        const b = await seedChild(ds, injector, 'succeeded', { result: 'B' })
        const recorded: TaskReplayLogEntry[] = []

        const results = await resolveAwaitChildren(makeDeps(injector, ds, true, recorded), [a, b], 0, new Map())

        expect(results).toEqual(['A', 'B'])
        expect(recorded).toHaveLength(1)
        expect(recorded[0].kind).toBe('await-children')
      })
    })

    it('throws SuspendedError when not all children are terminal', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'running')

        const err = await resolveAwaitChildren(makeDeps(injector, ds, false, []), [a], 0, new Map()).catch(
          (e: unknown) => e,
        )
        expect(isSuspendedError(err)).toBe(true)
      })
    })

    it('throws when a child failed', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'failed', { error: { name: 'Boom', message: 'kaboom' } })

        await expect(resolveAwaitChildren(makeDeps(injector, ds, true, []), [a], 0, new Map())).rejects.toThrow(
          /kaboom/,
        )
      })
    })

    it('throws with a fallback message when a failed child has no error', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'failed')

        await expect(resolveAwaitChildren(makeDeps(injector, ds, true, []), [a], 0, new Map())).rejects.toThrow(
          /unknown/,
        )
      })
    })

    it('throws when a child was cancelled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'cancelled')

        await expect(resolveAwaitChildren(makeDeps(injector, ds, true, []), [a], 0, new Map())).rejects.toThrow(
          /was cancelled/,
        )
      })
    })

    it('throws when a child row is missing', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const ghost: ChildHandle<unknown> = { taskId: 'nope', type: 'scan' }

        await expect(resolveAwaitChildren(makeDeps(injector, ds, true, []), [ghost], 0, new Map())).rejects.toThrow(
          /not found/,
        )
      })
    })

    it('short-circuits to the recorded output on replay', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const replay: ReplayIndex = new Map([
          [
            3,
            {
              id: 'parent-1:3',
              taskId: 'parent-1',
              stepIndex: 3,
              kind: 'await-children',
              output: ['cached'],
              createdAt: new Date().toISOString(),
            },
          ],
        ])
        const recorded: TaskReplayLogEntry[] = []

        const results = await resolveAwaitChildren(makeDeps(injector, ds, false, recorded), [], 3, replay)

        expect(results).toEqual(['cached'])
        expect(recorded).toHaveLength(0)
      })
    })
  })

  describe('resolveAwaitChildrenSettled', () => {
    it('returns a per-child discriminated result and records the step', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const ok = await seedChild(ds, injector, 'succeeded', { result: 42 })
        const bad = await seedChild(ds, injector, 'failed', { error: { name: 'E', message: 'nope' } })
        const gone = await seedChild(ds, injector, 'cancelled')
        const recorded: TaskReplayLogEntry[] = []

        const results = await resolveAwaitChildrenSettled(
          makeDeps(injector, ds, true, recorded),
          [ok, bad, gone],
          0,
          new Map(),
        )

        expect(results).toEqual([
          { status: 'succeeded', taskId: ok.taskId, type: 'scan', result: 42 },
          { status: 'failed', taskId: bad.taskId, type: 'scan', error: { name: 'E', message: 'nope' } },
          { status: 'cancelled', taskId: gone.taskId, type: 'scan' },
        ])
        expect(recorded[0].kind).toBe('await-children-settled')
      })
    })

    it('defaults the error projection when a failed child has none', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const bad = await seedChild(ds, injector, 'failed')

        const [result] = await resolveAwaitChildrenSettled(makeDeps(injector, ds, true, []), [bad], 0, new Map())

        expect(result).toEqual({
          status: 'failed',
          taskId: bad.taskId,
          type: 'scan',
          error: { name: 'Error', message: 'unknown' },
        })
      })
    })

    it('throws SuspendedError when not all children are terminal', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const a = await seedChild(ds, injector, 'running')

        const err = await resolveAwaitChildrenSettled(makeDeps(injector, ds, false, []), [a], 0, new Map()).catch(
          (e: unknown) => e,
        )
        expect(isSuspendedError(err)).toBe(true)
      })
    })

    it('throws when a child row is missing', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const ghost: ChildHandle<unknown> = { taskId: 'nope', type: 'scan' }

        await expect(
          resolveAwaitChildrenSettled(makeDeps(injector, ds, true, []), [ghost], 0, new Map()),
        ).rejects.toThrow(/not found/)
      })
    })

    it('short-circuits to the recorded output on replay', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        const cached = [{ status: 'succeeded' as const, taskId: 'x', type: 'scan', result: 1 }]
        const replay: ReplayIndex = new Map([
          [
            2,
            {
              id: 'parent-1:2',
              taskId: 'parent-1',
              stepIndex: 2,
              kind: 'await-children-settled',
              output: cached,
              createdAt: new Date().toISOString(),
            },
          ],
        ])
        const recorded: TaskReplayLogEntry[] = []

        const results = await resolveAwaitChildrenSettled(makeDeps(injector, ds, false, recorded), [], 2, replay)

        expect(results).toEqual(cached)
        expect(recorded).toHaveLength(0)
      })
    })
  })
})
