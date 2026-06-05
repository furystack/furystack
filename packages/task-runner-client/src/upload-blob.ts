import { TaskRunnerClientError } from './task-runner-client-error.js'
import type { BlobBody, BlobUploadUrl } from './types.js'

/** Fetch implementation used by {@link uploadBlob}. Defaults to the global `fetch`. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const toBodyInit = (body: BlobBody): BodyInit => body as BodyInit

/**
 * Uploads `body` to a presigned blob ticket, transparently handling both
 * paths the server can mint:
 *
 * - **Presigned-direct** (`method: 'PUT'`, no `fields`) — e.g. S3 PUT
 *   pre-sign or a filesystem proxy URL. The body is sent as the raw
 *   request body; `contentType` (when given) is set as `Content-Type`.
 * - **POST policy** (`method: 'POST'`, `fields` present) — e.g. an S3
 *   browser POST policy. `fields` are appended to a `multipart/form-data`
 *   form first, the file payload last (S3 requires the `file` field to be
 *   the final part).
 *
 * Non-2xx responses raise a {@link TaskRunnerClientError} with the
 * `upload-failed` code.
 */
export const uploadBlob = async (
  ticket: BlobUploadUrl,
  body: BlobBody,
  options?: { contentType?: string; fetchImpl?: FetchLike },
): Promise<void> => {
  const fetchImpl = options?.fetchImpl ?? globalThis.fetch

  let response: Response
  if (ticket.method === 'POST' && ticket.fields) {
    const form = new FormData()
    for (const [name, value] of Object.entries(ticket.fields)) {
      form.append(name, value)
    }
    form.append('file', new Blob([toBodyInit(body) as BlobPart], { type: options?.contentType }))
    response = await fetchImpl(ticket.url, { method: 'POST', body: form })
  } else {
    const headers: Record<string, string> = {}
    if (options?.contentType) headers['Content-Type'] = options.contentType
    response = await fetchImpl(ticket.url, {
      method: ticket.method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: toBodyInit(body),
    })
  }

  if (!response.ok) {
    throw new TaskRunnerClientError({
      code: 'upload-failed',
      message: `Blob upload to ${ticket.url} failed with status ${response.status}`,
      status: response.status,
    })
  }
}
