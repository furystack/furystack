import type { BlobStore } from '@furystack/blob-store'
import type { CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector, ServiceFactory } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { BlobStore as BlobStoreToken } from '@furystack/blob-store'
import { CrossNodeBus as CrossNodeBusToken } from '@furystack/cross-node-bus'
import { InProcessQueueAdapter } from './in-process-queue-adapter.js'
import { TaskDataSet, TaskReplayLogDataSet } from './task-data-set.js'
import { TaskRunnerCore, type TaskRunnerCoreOptions } from './task-runner-core.js'
import { TaskRunnerTelemetryToken, type TaskRunnerTelemetry } from './task-runner-telemetry.js'
import type { TaskRunner } from './task-runner.js'
import type { Task, TaskReplayLogEntry } from './types.js'

export type InProcessTaskRunnerOptions = TaskRunnerCoreOptions

/**
 * Single-process {@link TaskRunner}. All queue, replay, and dispatch
 * state lives in the process — there is no broker. Suitable for tests,
 * local development, and single-node deployments. For multi-node
 * deployments use a persistent runner adapter (e.g.
 * `@furystack/redis-task-runner`) and bind a cross-node-capable bus +
 * blob store.
 *
 * Persisted state still flows through {@link TaskDataSet} and
 * {@link TaskReplayLogDataSet}, so apps can swap the in-memory stores
 * for any other adapter without changing handler code.
 */
export class InProcessTaskRunner extends TaskRunnerCore {
  readonly #queueAdapter: InProcessQueueAdapter

  constructor(
    injector: Injector,
    bus: CrossNodeBus,
    blobStore: BlobStore,
    taskDs: DataSet<Task, 'id'>,
    replayDs: DataSet<TaskReplayLogEntry, 'id'>,
    telemetry: TaskRunnerTelemetry,
    options?: InProcessTaskRunnerOptions,
  ) {
    const queueAdapter = new InProcessQueueAdapter()
    super(
      {
        injector,
        bus,
        blobStore,
        taskDs,
        replayDs,
        telemetry,
        queueAdapter,
      },
      options,
    )
    this.#queueAdapter = queueAdapter
  }

  public override [Symbol.dispose](): void {
    super[Symbol.dispose]()
    this.#queueAdapter[Symbol.dispose]()
  }
}

export type DefineInProcessTaskRunnerOptions = InProcessTaskRunnerOptions

/**
 * Builds a `ServiceFactory` for the {@link TaskRunner} token bound to an
 * {@link InProcessTaskRunner}. Pulls `CrossNodeBus`, `BlobStore`,
 * `TaskDataSet`, `TaskReplayLogDataSet`, and `TaskRunnerTelemetryToken`
 * out of the injector at resolve time — bind those before resolving the
 * runner.
 *
 * @example
 * ```typescript
 * await using injector = createInjector()
 * injector.bind(BlobStore, ({ onDispose }) => {
 *   const store = new InMemoryBlobStore({ name: 'blobs' })
 *   onDispose(() => store[Symbol.dispose]())
 *   return store
 * })
 * injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 200 }))
 * ```
 */
export const defineInProcessTaskRunner = (options?: DefineInProcessTaskRunnerOptions): ServiceFactory<TaskRunner> => {
  return ({ inject, injector, onDispose }) => {
    const bus = inject(CrossNodeBusToken)
    const blobStore = inject(BlobStoreToken)
    const taskDs = inject(TaskDataSet)
    const replayDs = inject(TaskReplayLogDataSet)
    const telemetry = inject(TaskRunnerTelemetryToken)

    const runner = new InProcessTaskRunner(injector, bus, blobStore, taskDs, replayDs, telemetry, options)
    // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
    onDispose(() => runner[Symbol.dispose]())
    return runner
  }
}
