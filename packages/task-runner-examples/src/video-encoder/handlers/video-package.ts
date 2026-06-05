import { defineTaskHandler } from '@furystack/task-runner'
import { recordTaskBlobs, writeProducedBlob } from '../blob-helpers.js'
import type { PackagePayload, PackageResult } from '../types.js'

/** Leaf task: writes an HLS-style manifest referencing the muxed renditions. */
export const videoPackage = defineTaskHandler<PackagePayload, PackageResult>({
  type: 'video-package',
  version: 1,
  retentionPolicy: { onSuccess: 'keep' },
  handler: async (ctx, payload) => {
    ctx.reportProgress({ percent: 30 })
    const manifest = ['#EXTM3U', '#EXT-X-VERSION:3', ...payload.renditionKeys.map((key) => `#RENDITION:${key}`)].join(
      '\n',
    )
    const manifestBlob = await writeProducedBlob(
      ctx,
      'manifest.m3u8',
      new TextEncoder().encode(manifest),
      'application/vnd.apple.mpegurl',
    )
    await recordTaskBlobs(ctx, { produced: [manifestBlob] })
    ctx.reportProgress({ percent: 100 })
    return { manifestBlob }
  },
})
