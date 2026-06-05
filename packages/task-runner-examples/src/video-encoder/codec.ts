import type { EncodeProfile } from './types.js'

const PROFILE_BITRATE: Record<EncodeProfile, number> = {
  '480p': 1,
  '720p': 2,
  '1080p': 4,
}

/**
 * Derives a deterministic "duration" from the source byte length so the
 * showcase has a probe result to fan chunk counts out from. Pure — no I/O,
 * no clock — so it is safe to call from a replay-able handler.
 */
export const deriveDurationMs = (sourceByteLength: number): number => 1_000 + (sourceByteLength % 9_000)

/**
 * Picks how many chunks an encode is split into. Higher-bitrate profiles
 * fan out wider; clamped to a small range so the example DAG stays fast.
 */
export const chooseChunkCount = (durationMs: number, profile: EncodeProfile): number => {
  const base = Math.ceil(durationMs / 4_000)
  return Math.min(4, Math.max(2, base + PROFILE_BITRATE[profile] - 1))
}

/**
 * Deterministic stand-in for a real codec pass: prefixes a label and folds
 * the input bytes through a reversible rolling transform. Same input always
 * yields the same output, so re-execution after a replay/continuation
 * produces identical blobs.
 */
export const transformBytes = (input: Uint8Array, label: string): Uint8Array => {
  const prefix = new TextEncoder().encode(`${label}:`)
  const out = new Uint8Array(prefix.length + input.length)
  out.set(prefix, 0)
  for (let i = 0; i < input.length; i++) {
    out[prefix.length + i] = (input[i] + ((i + label.length) % 251)) % 256
  }
  return out
}

/** Builds a deterministic byte buffer standing in for an uploaded video. */
export const makeFakeVideoBytes = (seed: string, size = 4_096): Uint8Array => {
  const seedBytes = new TextEncoder().encode(seed)
  const out = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    out[i] = (seedBytes[i % seedBytes.length] + i * 31) % 256
  }
  return out
}
