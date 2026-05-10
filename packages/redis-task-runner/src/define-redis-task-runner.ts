import { BlobStore as BlobStoreToken } from '@furystack/blob-store'
import { CrossNodeBus as CrossNodeBusToken } from '@furystack/cross-node-bus'
import type { ServiceFactory } from '@furystack/inject'
import { TaskDataSet, TaskReplayLogDataSet, TaskRunnerTelemetryToken, type TaskRunner } from '@furystack/task-runner'
import { RedisTaskRunner, type RedisTaskRunnerOptions } from './redis-task-runner.js'
import type { RedisQueueAdapterOptions } from './redis-queue-adapter.js'

/**
 * Options accepted by {@link defineRedisTaskRunner}. `client` and
 * `serviceName` are required; the remaining knobs forward to
 * {@link RedisQueueAdapterOptions}.
 */
export type DefineRedisTaskRunnerOptions = Omit<RedisQueueAdapterOptions, 'client' | 'serviceName'> & {
  client: RedisQueueAdapterOptions['client']
  serviceName: string
} & RedisTaskRunnerOptions

/**
 * Returns a {@link ServiceFactory} for {@link TaskRunner}, backed by
 * Redis Streams. Override the (intentionally throwing) default
 * binding at boot:
 *
 * ```ts
 * const client = createClient({ url: process.env.REDIS_URL })
 * await client.connect()
 *
 * injector.bind(
 *   TaskRunner,
 *   defineRedisTaskRunner({
 *     client,
 *     serviceName: 'svc-a',
 *     topicPrefix: 'svc-a/',
 *     visibilityTimeoutMs: 60_000,
 *   }),
 * )
 * ```
 *
 * Caller still owns `client.connect()` / `client.quit()` —
 * the adapter never closes it.
 */
export const defineRedisTaskRunner = (options: DefineRedisTaskRunnerOptions): ServiceFactory<TaskRunner> => {
  const {
    client,
    serviceName,
    topicPrefix,
    consumerGroup,
    visibilityTimeoutMs,
    visibilityTimeoutByType,
    blockTimeoutMs,
    retryBackoffMs,
    idempotencyTtlSec,
    reconcilerIntervalMs,
    sweepIntervalMs,
  } = options

  return ({ inject, injector, onDispose }) => {
    const bus = inject(CrossNodeBusToken)
    const blobStore = inject(BlobStoreToken)
    const taskDs = inject(TaskDataSet)
    const replayDs = inject(TaskReplayLogDataSet)
    const telemetry = inject(TaskRunnerTelemetryToken)

    const runner = new RedisTaskRunner(
      {
        injector,
        bus,
        blobStore,
        taskDs,
        replayDs,
        telemetry,
        client,
        serviceName,
        topicPrefix,
        consumerGroup,
        visibilityTimeoutMs,
        visibilityTimeoutByType,
        blockTimeoutMs,
        retryBackoffMs,
        idempotencyTtlSec,
      },
      { reconcilerIntervalMs, sweepIntervalMs },
    )
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => runner[Symbol.dispose]())
    return runner
  }
}
