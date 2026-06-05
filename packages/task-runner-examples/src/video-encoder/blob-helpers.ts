import { collectBlobStream, type BlobRef } from '@furystack/blob-store'
import { getDataSetFor } from '@furystack/repository'
import { TaskDataSet, type TaskContext } from '@furystack/task-runner'

/** Reads a blob fully into memory by key. Showcase blobs are small. */
export const readBlobBytes = async (ctx: TaskContext, key: string): Promise<Uint8Array> => {
  const { stream } = await ctx.blobStore.get(key)
  return collectBlobStream(stream)
}

/** Allocates a task-scoped blob, writes `bytes`, and returns its {@link BlobRef}. */
export const writeProducedBlob = async (
  ctx: TaskContext,
  suffix: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<BlobRef> => {
  const ref = ctx.allocateBlob(suffix, { contentType })
  await ctx.blobStore.put(ref.key, bytes, { contentType })
  return ref
}

/**
 * Records a task's blob ownership on its own row so the sweeper (PRD §10.3
 * step 5) and the `GET /tasks/:id/download` endpoint (which reads
 * `producedBlobs[0]`) see them. The runner never auto-derives these from a
 * handler's return value, so producers self-report. Partial-merge update,
 * so recording `produced` does not clobber a previously recorded
 * `consumed` array.
 */
export const recordTaskBlobs = async (
  ctx: TaskContext,
  blobs: { produced?: BlobRef[]; consumed?: BlobRef[] },
): Promise<void> => {
  const ds = getDataSetFor(ctx.injector, TaskDataSet)
  await ds.update(ctx.injector, ctx.taskId, {
    ...(blobs.produced ? { producedBlobs: blobs.produced } : {}),
    ...(blobs.consumed ? { consumedBlobs: blobs.consumed } : {}),
  })
}
