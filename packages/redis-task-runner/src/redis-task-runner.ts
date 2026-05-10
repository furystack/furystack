import type { BlobStore } from '@furystack/blob-store'
import type { CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { Task, TaskReplayLogEntry } from '@furystack/task-runner'
import { TaskRunnerCore, type TaskRunnerCoreOptions } from '@furystack/task-runner'
import type { TaskRunnerTelemetry } from '@furystack/task-runner'
import { RedisQueueAdapter, type RedisQueueAdapterOptions } from './redis-queue-adapter.js'

export type RedisTaskRunnerOptions = TaskRunnerCoreOptions

export type RedisTaskRunnerDeps = Omit<RedisQueueAdapterOptions, 'client' | 'serviceName'> & {
  injector: Injector
  bus: CrossNodeBus
  blobStore: BlobStore
  taskDs: DataSet<Task, 'id'>
  replayDs: DataSet<TaskReplayLogEntry, 'id'>
  telemetry: TaskRunnerTelemetry
  client: RedisQueueAdapterOptions['client']
  serviceName: string
}

/**
 * Redis-Streams-backed {@link TaskRunnerCore}. Uses
 * `@furystack/redis-task-runner` consumer-group claim plumbing while
 * inheriting all task lifecycle, replay, retry, cancel-cascade, and
 * telemetry behavior from the core class. Apps bind it via
 * {@link defineRedisTaskRunner} so the adapter shares lifetime with
 * the surrounding injector scope.
 */
export class RedisTaskRunner extends TaskRunnerCore {
  readonly #queueAdapter: RedisQueueAdapter

  constructor(deps: RedisTaskRunnerDeps, options?: RedisTaskRunnerOptions) {
    const queueAdapter = new RedisQueueAdapter({
      client: deps.client,
      serviceName: deps.serviceName,
      topicPrefix: deps.topicPrefix,
      consumerGroup: deps.consumerGroup,
      visibilityTimeoutMs: deps.visibilityTimeoutMs,
      visibilityTimeoutByType: deps.visibilityTimeoutByType,
      blockTimeoutMs: deps.blockTimeoutMs,
      retryBackoffMs: deps.retryBackoffMs,
      idempotencyTtlSec: deps.idempotencyTtlSec,
      schedulerIntervalMs: deps.schedulerIntervalMs,
    })
    super(
      {
        injector: deps.injector,
        bus: deps.bus,
        blobStore: deps.blobStore,
        taskDs: deps.taskDs,
        replayDs: deps.replayDs,
        telemetry: deps.telemetry,
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
