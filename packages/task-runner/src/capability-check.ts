import type { BlobStoreCapabilities } from '@furystack/blob-store'
import type { CrossNodeBusCapabilities } from '@furystack/cross-node-bus'
import type { TaskRunnerCapabilities } from './task-runner.js'

/**
 * Asserts at boot that the bound runner, blob-store, and bus adapters form
 * a coherent deployment shape. Throws on misconfiguration so the error
 * surfaces immediately rather than manifesting as silent data loss or
 * stale progress at runtime.
 */
export const assertCapabilities = (
  runner: TaskRunnerCapabilities,
  blob: BlobStoreCapabilities,
  bus: CrossNodeBusCapabilities,
): void => {
  if (runner.persistent && !blob.crossNodeAccessible) {
    throw new Error(
      'TaskRunner: bound queue adapter is persistent (multi-node-capable) but the bound BlobStore ' +
        'is not cross-node-accessible. Bind a cross-node blob store (e.g. defineS3BlobStore) ' +
        'or switch to an in-process task runner.',
    )
  }

  if (runner.persistent && !bus.crossNodeDelivery) {
    throw new Error(
      'TaskRunner: bound queue adapter is persistent (multi-node-capable) but the bound CrossNodeBus ' +
        'is in-process only. Bind a cross-node bus adapter (e.g. defineRedisCrossNodeBusAdapter) ' +
        'before starting workers.',
    )
  }
}
