import { defineTaskHandler } from '@furystack/task-runner'
import { transformBytes } from '../codec.js'
import { readBlobBytes, recordTaskBlobs, writeProducedBlob } from '../blob-helpers.js'
import type { ThumbnailPayload, ThumbnailResult } from '../types.js'

/** Leaf task: produces a deterministic poster image from the source blob. */
export const thumbnail = defineTaskHandler<ThumbnailPayload, ThumbnailResult>({
  type: 'thumbnail',
  version: 1,
  retentionPolicy: { onSuccess: 'keep' },
  handler: async (ctx, payload) => {
    ctx.reportProgress({ percent: 20 })
    const source = await readBlobBytes(ctx, payload.sourceKey)
    const frame = transformBytes(source.subarray(0, 256), `thumb@${payload.atMs}`)
    const thumbnailBlob = await writeProducedBlob(ctx, 'thumbnail.jpg', frame, 'image/jpeg')
    await recordTaskBlobs(ctx, { produced: [thumbnailBlob] })
    ctx.reportProgress({ percent: 100 })
    return { thumbnailBlob }
  },
})
