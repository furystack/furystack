import type { TaskStatus } from './types.js'

/** Payload shape for `tasks/cancel/${type}` bus messages (PRD §11 cancel transport). */
export type CancelBroadcastPayload = { taskIds: string[] }

/** Resolves after `ms`. Used to space out idempotency-race polling. */
export const waitMs = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Decodes the parent `resumeToken` (a JSON array of awaited child ids) back
 * into a string list. Returns `undefined` for absent/garbled tokens so the
 * caller can fall back to the parent's full `childTaskIds`.
 */
export const parseAwaitedChildIds = (resumeToken: string | undefined): string[] | undefined => {
  if (!resumeToken) return undefined
  try {
    const parsed: unknown = JSON.parse(resumeToken)
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) return parsed
    return undefined
  } catch {
    return undefined
  }
}

/** Narrows a status to the three a child can terminate in (drives parent-wake bookkeeping). */
export const isChildCompletionStatus = (status: TaskStatus): status is 'succeeded' | 'failed' | 'cancelled' =>
  status === 'succeeded' || status === 'failed' || status === 'cancelled'

/** Best-effort serialized byte size of a payload for telemetry; never throws. */
export const estimateSize = (value: unknown): number => {
  try {
    return Buffer.byteLength(JSON.stringify(value) ?? '')
  } catch {
    return 0
  }
}

/** Projects an unknown thrown value into the serializable `{ name, message, stack? }` shape. */
export const toErrorInfo = (error: unknown): { name: string; message: string; stack?: string } => {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack }
  return { name: 'Error', message: String(error) }
}
