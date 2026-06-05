import type { ReplayIndex } from './replay-index.js'
import type { TaskReplayLogEntry } from './types.js'

/** Recorded {@link TaskContext.fetch} response, persisted on the replay log. */
export type FetchRecord = {
  status: number
  statusText: string
  headers: Record<string, string>
  bodyBase64: string
}

/** HTTP statuses that must not carry a response body. */
const NULL_BODY_STATUSES: ReadonlySet<number> = new Set([101, 103, 204, 205, 304])

/** Reconstructs a `Response` from a recorded {@link FetchRecord} (used on replay). */
export const rebuildResponse = (record: FetchRecord): Response => {
  const hasBody = !NULL_BODY_STATUSES.has(record.status) && record.bodyBase64.length > 0
  const body = hasBody ? Buffer.from(record.bodyBase64, 'base64') : null
  return new Response(body, { status: record.status, statusText: record.statusText, headers: record.headers })
}

type RecordedFetchDeps = {
  taskId: string
  persistReplayEntry: (entry: TaskReplayLogEntry) => Promise<void>
}

/**
 * Determinism-safe `fetch` body for {@link TaskContext.fetch}: returns the
 * recorded response on replay, otherwise performs the call, buffers + records
 * the response, and returns it. See {@link TaskContext.fetch} for the buffering
 * caveats.
 */
export const recordedFetch = async (
  deps: RecordedFetchDeps,
  input: string | URL,
  init: RequestInit | undefined,
  step: number,
  replayIndex: ReplayIndex,
): Promise<Response> => {
  const cached = replayIndex.get(step)
  if (cached?.kind === 'fetch' && cached.output) {
    return rebuildResponse(cached.output as FetchRecord)
  }

  const response = await globalThis.fetch(input, init)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  const record: FetchRecord = {
    status: response.status,
    statusText: response.statusText,
    headers,
    bodyBase64: Buffer.from(bytes).toString('base64'),
  }

  await deps.persistReplayEntry({
    id: `${deps.taskId}:${step}`,
    taskId: deps.taskId,
    stepIndex: step,
    kind: 'fetch',
    input: { url: input.toString(), method: init?.method ?? 'GET' },
    output: record,
    createdAt: new Date().toISOString(),
  })

  return rebuildResponse(record)
}
