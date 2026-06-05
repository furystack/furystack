import { defineTaskHandler } from '@furystack/task-runner'
import { chooseChunkCount } from '../codec.js'
import type { ChildHandle } from '@furystack/task-runner'
import type {
  EncodeChunkPayload,
  EncodeChunkResult,
  EncodeH264Payload,
  EncodeH264Result,
  MuxResult,
  ProbeResult,
} from '../types.js'

/**
 * Composed task: probes the source, fans out per-chunk encodes, then muxes
 * the chunks back together. Demonstrates a grandchild-level DAG (its own
 * children spawn no further tasks, but it runs under `process-upload`).
 */
export const videoEncodeH264 = defineTaskHandler<EncodeH264Payload, EncodeH264Result>({
  type: 'video-encode-h264',
  version: 1,
  retentionPolicy: { onSuccess: 'delete-intermediate' },
  handler: async (ctx, { sourceKey, profile }) => {
    const probe = await ctx.spawnChildAndAwait<{ sourceKey: string }, ProbeResult>('video-probe', { sourceKey })
    const chunkCount = chooseChunkCount(probe.durationMs, profile)

    const chunkHandles: Array<ChildHandle<EncodeChunkResult>> = []
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      chunkHandles.push(
        await ctx.spawnChild<EncodeChunkPayload, EncodeChunkResult>('video-encode-chunk', {
          sourceKey,
          profile,
          chunkIndex,
          chunkCount,
        }),
      )
    }
    const chunks = await ctx.awaitChildren(chunkHandles)

    const mux = await ctx.spawnChildAndAwait<{ chunkKeys: string[]; profile: string }, MuxResult>('video-mux', {
      chunkKeys: chunks.map((c) => c.chunkBlob.key),
      profile,
    })

    return { outputBlob: mux.outputBlob, profile, durationMs: probe.durationMs }
  },
})
