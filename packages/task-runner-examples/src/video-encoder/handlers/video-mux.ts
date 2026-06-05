import { defineTaskHandler } from '@furystack/task-runner'
import { transformBytes } from '../codec.js'
import { readBlobBytes, recordTaskBlobs, writeProducedBlob } from '../blob-helpers.js'
import type { MuxPayload, MuxResult } from '../types.js'

/** Leaf task: concatenates encoded chunks into one muxed rendition blob. */
export const videoMux = defineTaskHandler<MuxPayload, MuxResult>({
  type: 'video-mux',
  version: 1,
  retentionPolicy: { onSuccess: 'delete-intermediate' },
  handler: async (ctx, payload) => {
    ctx.reportProgress({ percent: 10 })
    const parts: Uint8Array[] = []
    for (const key of payload.chunkKeys) {
      parts.push(await readBlobBytes(ctx, key))
    }
    const total = parts.reduce((sum, p) => sum + p.byteLength, 0)
    const merged = new Uint8Array(total)
    let offset = 0
    for (const part of parts) {
      merged.set(part, offset)
      offset += part.byteLength
    }
    const muxed = transformBytes(merged, `${payload.profile}-mux`)
    const outputBlob = await writeProducedBlob(ctx, `mux/${payload.profile}.mp4`, muxed, 'video/mp4')
    await recordTaskBlobs(ctx, { produced: [outputBlob] })
    ctx.reportProgress({ percent: 100 })
    return { outputBlob }
  },
})
