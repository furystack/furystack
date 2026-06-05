import { defineTaskHandler } from '@furystack/task-runner'
import { recordTaskBlobs } from '../blob-helpers.js'
import type { ChildHandle } from '@furystack/task-runner'
import type {
  EncodeH264Payload,
  EncodeH264Result,
  PackageResult,
  ProbeResult,
  ProcessUploadPayload,
  ProcessUploadResult,
  ThumbnailResult,
} from '../types.js'

/**
 * Top-level orchestrator (PRD §10): probes the upload, fans out one encode
 * per profile plus a thumbnail in parallel, then packages the renditions
 * into a manifest. Each `video-encode-h264` child is itself a sub-DAG, so
 * the full tree is three levels deep.
 */
export const processUpload = defineTaskHandler<ProcessUploadPayload, ProcessUploadResult>({
  type: 'process-upload',
  version: 1,
  retentionPolicy: { onSuccess: 'keep' },
  handler: async (ctx, { sourceKey, profiles }) => {
    const source = { storeName: ctx.blobStore.storeName, key: sourceKey }
    await recordTaskBlobs(ctx, { consumed: [source] })
    ctx.reportProgress({ percent: 5, meta: { stage: 'probing' } })

    const probe = await ctx.spawnChildAndAwait<{ sourceKey: string }, ProbeResult>('video-probe', { sourceKey })
    ctx.reportProgress({ percent: 25, meta: { stage: 'encoding' } })

    const encodeHandles: Array<ChildHandle<EncodeH264Result>> = []
    for (const profile of profiles) {
      encodeHandles.push(
        await ctx.spawnChild<EncodeH264Payload, EncodeH264Result>('video-encode-h264', { sourceKey, profile }),
      )
    }
    const thumbnailHandle = await ctx.spawnChild<{ sourceKey: string; atMs: number }, ThumbnailResult>('thumbnail', {
      sourceKey,
      atMs: Math.floor(probe.durationMs / 2),
    })

    const encodes = await ctx.awaitChildren(encodeHandles)
    const [thumb] = await ctx.awaitChildren([thumbnailHandle])
    ctx.reportProgress({ percent: 85, meta: { stage: 'packaging' } })

    const pkg = await ctx.spawnChildAndAwait<{ renditionKeys: string[] }, PackageResult>('video-package', {
      renditionKeys: encodes.map((e) => e.outputBlob.key),
    })

    await recordTaskBlobs(ctx, { produced: [pkg.manifestBlob, thumb.thumbnailBlob] })
    return { manifestBlob: pkg.manifestBlob, thumbnailBlob: thumb.thumbnailBlob, durationMs: probe.durationMs }
  },
})
