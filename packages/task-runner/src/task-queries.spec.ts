import { describe, expect, it } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { allChildrenTerminal, buildTree, detectCycle, findByIdempotencyKey } from './task-queries.js'
import { TaskDataSet } from './task-data-set.js'
import { Task } from './types.js'

const seed = async (
  ds: DataSet<Task, 'id'>,
  injector: Injector,
  id: string,
  extra: Partial<Task> = {},
): Promise<void> => {
  const task: Task = Object.assign(new Task(), {
    id,
    type: 'echo',
    handlerVersion: 1,
    status: 'pending',
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
}

describe('task-queries', () => {
  describe('detectCycle', () => {
    it('returns true when the parent chain reaches the new task', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        await seed(ds, injector, 'a')
        await seed(ds, injector, 'b', { parentTaskId: 'a' })
        // Adding 'a' under 'b' would close the cycle a → b → a.
        expect(await detectCycle(ds, injector, 'a', 'b')).toBe(true)
      })
    })

    it('returns false for an acyclic chain', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        await seed(ds, injector, 'a')
        await seed(ds, injector, 'b', { parentTaskId: 'a' })
        expect(await detectCycle(ds, injector, 'new', 'b')).toBe(false)
      })
    })

    it('bails out of a pre-existing loop without infinite-looping', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        // Corrupt data: x ↔ y point at each other. detectCycle must terminate.
        await seed(ds, injector, 'x', { parentTaskId: 'y' })
        await seed(ds, injector, 'y', { parentTaskId: 'x' })
        expect(await detectCycle(ds, injector, 'unrelated', 'x')).toBe(false)
      })
    })
  })

  describe('buildTree', () => {
    it('materializes the DAG, skipping missing children', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        await seed(ds, injector, 'root', { childTaskIds: ['c1', 'ghost'] })
        await seed(ds, injector, 'c1', { parentTaskId: 'root', childTaskIds: ['gc1'] })
        await seed(ds, injector, 'gc1', { parentTaskId: 'c1' })

        const root = (await ds.get(injector, 'root')) as Task
        const tree = await buildTree(ds, injector, root)

        expect(tree.task.id).toBe('root')
        expect(tree.children).toHaveLength(1)
        expect(tree.children[0].task.id).toBe('c1')
        expect(tree.children[0].children[0].task.id).toBe('gc1')
      })
    })
  })

  describe('allChildrenTerminal', () => {
    it('is false when any id is missing or non-terminal, true when all terminal', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        await seed(ds, injector, 'done', { status: 'succeeded' })
        await seed(ds, injector, 'running', { status: 'running' })

        expect(await allChildrenTerminal(ds, injector, ['done'])).toBe(true)
        expect(await allChildrenTerminal(ds, injector, ['done', 'running'])).toBe(false)
        expect(await allChildrenTerminal(ds, injector, ['missing'])).toBe(false)
      })
    })
  })

  describe('findByIdempotencyKey', () => {
    it('returns the matching task or undefined', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const ds = getDataSetFor(injector, TaskDataSet)
        await seed(ds, injector, 'k1', { idempotencyKey: 'key-1', type: 'echo' })

        expect((await findByIdempotencyKey(ds, injector, 'key-1', 'echo'))?.id).toBe('k1')
        expect(await findByIdempotencyKey(ds, injector, 'key-1', 'other')).toBeUndefined()
        expect(await findByIdempotencyKey(ds, injector, 'nope', 'echo')).toBeUndefined()
      })
    })
  })
})
