import { describe, expect, it } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { getDataSetFor } from '@furystack/repository'
import { TaskDataSet } from './task-data-set.js'
import { TaskBlobSweeper, defineTaskBlobSweeper } from './task-blob-sweeper.js'
import { TaskRunnerTelemetryToken, type TaskRunnerTelemetryEvents } from './task-runner-telemetry.js'
import type { Task, TaskRetentionPolicy, TaskStatus } from './types.js'

const MS_PER_DAY = 86_400_000
const STORE = 'sweeper-tests'

const bindBlobStore = (injector: Injector): void => {
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: STORE })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
    onDispose(() => store[Symbol.dispose]())
    return store
  })
}

let taskCounter = 0

const seedTask = async (
  injector: Injector,
  args: {
    status: TaskStatus
    retentionPolicy: TaskRetentionPolicy
    terminalAgeDays?: number
    produced?: string[]
    consumed?: string[]
    blobsSweptAt?: string
    parentTaskId?: string
    childTaskIds?: string[]
  },
): Promise<Task> => {
  const blobStore = injector.get(BlobStore)
  for (const key of [...(args.produced ?? []), ...(args.consumed ?? [])]) {
    await blobStore.put(key, Buffer.from(key))
  }
  const id = `task-${++taskCounter}`
  const terminalAt =
    args.terminalAgeDays === undefined
      ? undefined
      : new Date(Date.now() - args.terminalAgeDays * MS_PER_DAY).toISOString()
  const task: Task = {
    id,
    type: 'echo',
    handlerVersion: 1,
    status: args.status,
    payload: {},
    parentTaskId: args.parentTaskId,
    childTaskIds: args.childTaskIds ?? [],
    submittedAt: new Date(Date.now() - 365 * MS_PER_DAY).toISOString(),
    attempts: [],
    events: [],
    producedBlobs: (args.produced ?? []).map((key) => ({ storeName: STORE, key })),
    consumedBlobs: (args.consumed ?? []).map((key) => ({ storeName: STORE, key })),
    retentionPolicy: args.retentionPolicy,
    tags: [],
    terminalAt,
    blobsSweptAt: args.blobsSweptAt,
  }
  await getDataSetFor(injector, TaskDataSet).add(injector, task)
  return task
}

const blobExists = async (injector: Injector, key: string): Promise<boolean> =>
  (await injector.get(BlobStore).head(key)) !== undefined

const getTask = async (injector: Injector, id: string): Promise<Task | undefined> =>
  getDataSetFor(injector, TaskDataSet).get(injector, id)

const makeSweeper = (injector: Injector): TaskBlobSweeper =>
  new TaskBlobSweeper(
    {
      injector,
      taskDs: injector.get(TaskDataSet),
      blobStore: injector.get(BlobStore),
      telemetry: injector.get(TaskRunnerTelemetryToken),
    },
    { scanIntervalMs: Infinity },
  )

const KEEP: TaskRetentionPolicy = { onSuccess: 'keep', onFailure: 'keep', ttlAfterTerminalDays: 30 }

describe('TaskBlobSweeper', () => {
  describe('retention modes', () => {
    it('delete-all removes produced and consumed blobs (succeeded)', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const task = await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 30 },
          terminalAgeDays: 40,
          produced: ['p1'],
          consumed: ['c1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()

        expect(result).toMatchObject({ sweptCount: 1, deletedBlobCount: 2 })
        expect(await blobExists(injector, 'p1')).toBe(false)
        expect(await blobExists(injector, 'c1')).toBe(false)
        const swept = await getTask(injector, task.id)
        expect(swept?.blobsSweptAt).toBeTruthy()
        expect(swept?.producedBlobs).toEqual([])
        expect(swept?.consumedBlobs).toEqual([])
      })
    })

    it('delete-intermediate removes produced but keeps consumed', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const task = await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-intermediate', onFailure: 'keep', ttlAfterTerminalDays: 7 },
          terminalAgeDays: 10,
          produced: ['p1'],
          consumed: ['c1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()

        expect(result).toMatchObject({ sweptCount: 1, deletedBlobCount: 1 })
        expect(await blobExists(injector, 'p1')).toBe(false)
        expect(await blobExists(injector, 'c1')).toBe(true)
        const swept = await getTask(injector, task.id)
        expect(swept?.producedBlobs).toEqual([])
        expect(swept?.consumedBlobs).toHaveLength(1)
      })
    })

    it('keep deletes nothing but still marks the task swept', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const task = await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: KEEP,
          terminalAgeDays: 40,
          produced: ['p1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()

        expect(result).toMatchObject({ sweptCount: 1, deletedBlobCount: 0 })
        expect(await blobExists(injector, 'p1')).toBe(true)
        const swept = await getTask(injector, task.id)
        expect(swept?.blobsSweptAt).toBeTruthy()
        expect(swept?.producedBlobs).toHaveLength(1)
      })
    })

    it('failed tasks use the onFailure policy', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'failed',
          retentionPolicy: { onSuccess: 'keep', onFailure: 'delete-all', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1'],
          consumed: ['c1'],
        })
        using sweeper = makeSweeper(injector)
        await sweeper.runOnce()
        expect(await blobExists(injector, 'p1')).toBe(false)
        expect(await blobExists(injector, 'c1')).toBe(false)
      })
    })

    it('cancelled tasks use the onFailure policy', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'cancelled',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()
        // onFailure is 'keep' → nothing deleted, but marked swept.
        expect(result.deletedBlobCount).toBe(0)
        expect(await blobExists(injector, 'p1')).toBe(true)
      })
    })
  })

  describe('parent/child retention independence (open question #2)', () => {
    it('does not apply a failed parent onFailure policy to a child that owns its own retention', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const child = await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: KEEP,
          terminalAgeDays: 40,
          produced: ['child-out'],
        })
        await seedTask(injector, {
          status: 'failed',
          retentionPolicy: { onSuccess: 'keep', onFailure: 'delete-all', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 40,
          produced: ['parent-out'],
          childTaskIds: [child.id],
        })

        using sweeper = makeSweeper(injector)
        await sweeper.runOnce()

        // Parent's own blobs go under its onFailure policy; the child's blobs
        // survive under the child's own `keep` policy — parent failure never
        // rewrites child retention.
        expect(await blobExists(injector, 'parent-out')).toBe(false)
        expect(await blobExists(injector, 'child-out')).toBe(true)
      })
    })
  })

  describe('TTL gating', () => {
    it('does not sweep tasks whose TTL has not elapsed', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const task = await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 30 },
          terminalAgeDays: 5,
          produced: ['p1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()

        expect(result.sweptCount).toBe(0)
        expect(await blobExists(injector, 'p1')).toBe(true)
        const after = await getTask(injector, task.id)
        expect(after?.blobsSweptAt).toBeUndefined()
      })
    })

    it('does not sweep non-terminal tasks', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'running',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 0 },
          terminalAgeDays: 40,
          produced: ['p1'],
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()
        expect(result.scannedCount).toBe(0)
        expect(await blobExists(injector, 'p1')).toBe(true)
      })
    })
  })

  describe('idempotency', () => {
    it('skips already-swept tasks on subsequent runs', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1'],
          blobsSweptAt: new Date().toISOString(),
        })
        using sweeper = makeSweeper(injector)
        const result = await sweeper.runOnce()
        expect(result.scannedCount).toBe(0)
        expect(await blobExists(injector, 'p1')).toBe(true)
      })
    })

    it('a second run sweeps nothing once everything is marked', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1'],
        })
        using sweeper = makeSweeper(injector)
        expect((await sweeper.runOnce()).sweptCount).toBe(1)
        expect((await sweeper.runOnce()).sweptCount).toBe(0)
      })
    })
  })

  describe('telemetry', () => {
    it('emits onSweeperRun and onSweeperBlobDeleted', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        const runs: Array<TaskRunnerTelemetryEvents['onSweeperRun']> = []
        const deletes: Array<TaskRunnerTelemetryEvents['onSweeperBlobDeleted']> = []
        const telemetry = injector.get(TaskRunnerTelemetryToken)
        telemetry.subscribe('onSweeperRun', (e) => {
          runs.push(e)
        })
        telemetry.subscribe('onSweeperBlobDeleted', (e) => {
          deletes.push(e)
        })

        await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1', 'p2'],
        })
        using sweeper = makeSweeper(injector)
        await sweeper.runOnce()

        expect(runs).toHaveLength(1)
        expect(runs[0]).toMatchObject({ scannedCount: 1, sweptCount: 1, deletedBlobCount: 2 })
        expect(deletes.map((d) => d.key).sort()).toEqual(['p1', 'p2'])
        expect(deletes.every((d) => d.reason === 'produced')).toBe(true)
      })
    })
  })

  describe('defineTaskBlobSweeper', () => {
    it('mints a singleton token and auto-runs on its interval', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindBlobStore(injector)
        await seedTask(injector, {
          status: 'succeeded',
          retentionPolicy: { onSuccess: 'delete-all', onFailure: 'keep', ttlAfterTerminalDays: 1 },
          terminalAgeDays: 5,
          produced: ['p1'],
        })

        const Sweeper = defineTaskBlobSweeper({ scanIntervalMs: 10, batchSize: 50 })
        const a = injector.get(Sweeper)
        const b = injector.get(Sweeper)
        expect(a).toBe(b)

        await new Promise((r) => setTimeout(r, 40))
        expect(await blobExists(injector, 'p1')).toBe(false)
      })
    })
  })
})
