import { defineTaskHandler } from '@furystack/task-runner'
import { deriveDurationMs } from '../codec.js'
import { readBlobBytes, recordTaskBlobs } from '../blob-helpers.js'
import type { ProbePayload, ProbeResult } from '../types.js'

/** Leaf task: inspects the source blob and reports a deterministic duration. */
export const videoProbe = defineTaskHandler<ProbePayload, ProbeResult>({
  type: 'video-probe',
  version: 1,
  retentionPolicy: { onSuccess: 'keep' },
  handler: async (ctx, payload) => {
    ctx.reportProgress({ percent: 10 })
    const bytes = await readBlobBytes(ctx, payload.sourceKey)
    await recordTaskBlobs(ctx, { consumed: [{ storeName: ctx.blobStore.storeName, key: payload.sourceKey }] })
    ctx.reportProgress({ percent: 100 })
    return { durationMs: deriveDurationMs(bytes.byteLength), trackCount: 2 }
  },
})
