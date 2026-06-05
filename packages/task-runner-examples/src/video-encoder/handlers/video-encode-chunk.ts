import { defineTaskHandler } from '@furystack/task-runner'
import { transformBytes } from '../codec.js'
import { readBlobBytes, recordTaskBlobs, writeProducedBlob } from '../blob-helpers.js'
import type { EncodeChunkPayload, EncodeChunkResult } from '../types.js'

/**
 * Leaf task: encodes one chunk of a rendition. Subject to the
 * `video-encode-chunk` fleet cap (PRD §11) to model GPU scarcity.
 */
export const videoEncodeChunk = defineTaskHandler<EncodeChunkPayload, EncodeChunkResult>({
  type: 'video-encode-chunk',
  version: 1,
  retentionPolicy: { onSuccess: 'delete-intermediate' },
  handler: async (ctx, payload) => {
    ctx.reportProgress({ percent: 5, meta: { chunkIndex: payload.chunkIndex } })
    const source = await readBlobBytes(ctx, payload.sourceKey)
    await ctx.sleep(5)
    const encoded = transformBytes(source, `${payload.profile}-chunk-${payload.chunkIndex}`)
    const chunkBlob = await writeProducedBlob(
      ctx,
      `encode/${payload.profile}/chunk-${payload.chunkIndex}.ts`,
      encoded,
      'video/mp2t',
    )
    await recordTaskBlobs(ctx, { produced: [chunkBlob] })
    ctx.reportProgress({ percent: 100, meta: { chunkIndex: payload.chunkIndex } })
    return { chunkBlob, chunkIndex: payload.chunkIndex }
  },
})
