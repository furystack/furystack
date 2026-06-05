import type { BlobRef } from '@furystack/blob-store'

/** Encoding profile the simulated pipeline produces a rendition for. */
export type EncodeProfile = '480p' | '720p' | '1080p'

/** Payload for the top-level `process-upload` orchestrator task. */
export type ProcessUploadPayload = {
  /** Blob key of the uploaded source video (allocated server-side, filled in by the client after upload). */
  sourceKey: string
  /** Renditions to produce. */
  profiles: EncodeProfile[]
}

/** Result of `process-upload`: the HLS manifest plus a poster thumbnail. */
export type ProcessUploadResult = {
  manifestBlob: BlobRef
  thumbnailBlob: BlobRef
  durationMs: number
}

export type ProbePayload = { sourceKey: string }
export type ProbeResult = { durationMs: number; trackCount: number }

export type EncodeH264Payload = { sourceKey: string; profile: EncodeProfile }
export type EncodeH264Result = { outputBlob: BlobRef; profile: EncodeProfile; durationMs: number }

export type EncodeChunkPayload = {
  sourceKey: string
  profile: EncodeProfile
  chunkIndex: number
  chunkCount: number
}
export type EncodeChunkResult = { chunkBlob: BlobRef; chunkIndex: number }

export type MuxPayload = { chunkKeys: string[]; profile: EncodeProfile }
export type MuxResult = { outputBlob: BlobRef }

export type PackagePayload = { renditionKeys: string[] }
export type PackageResult = { manifestBlob: BlobRef }

export type ThumbnailPayload = { sourceKey: string; atMs: number }
export type ThumbnailResult = { thumbnailBlob: BlobRef }
