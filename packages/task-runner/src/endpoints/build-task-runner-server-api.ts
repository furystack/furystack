import { BlobStore as BlobStoreToken, BlobStoreError, type BlobStore, type BlobUploadUrl } from '@furystack/blob-store'
import type { Injector } from '@furystack/inject'
import type { ServerApi } from '@furystack/rest-service'
import { HttpUserContext } from '@furystack/rest-service'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { TaskRunner as TaskRunnerToken } from '../task-runner.js'
import type { TaskRunner } from '../task-runner.js'
import type { Task, TaskRetentionPolicy, TaskTreeNode } from '../types.js'
import { authorize, type AuthorizerSpec, type RouteAction } from './route-authorizer.js'

/**
 * Per-task-type authorizer configuration. Roles per action are AND-ed —
 * the requesting identity must satisfy every role in the array. Missing
 * keys default to "authenticated only".
 */
export type TaskAuthorizers = Record<string, AuthorizerSpec>

/**
 * Options accepted by {@link buildTaskRunnerServerApi}.
 */
export type TaskRunnerServerApiOptions = {
  /**
   * Owning injector. The server API resolves `TaskRunner`, `BlobStore`,
   * and `HttpUserContext` from this injector.
   */
  injector: Injector
  /**
   * URL prefix the helper handles, e.g. `'/tasks'`. Trailing slashes are
   * trimmed. Routes mounted under the prefix are documented on
   * {@link buildTaskRunnerServerApi}.
   */
  rootPath: string
  /** Optional per-task-type authorizer map. */
  authorizers?: TaskAuthorizers
  /**
   * TTL for upload tickets minted from `POST {rootPath}`. Defaults to 1
   * hour. Per-slot overrides on the request body still take precedence.
   */
  defaultUploadTtlSec?: number
  /**
   * TTL for download URLs minted from `GET {rootPath}/:id/download` and
   * `/blobs/:key`. Defaults to 1 hour.
   */
  defaultDownloadTtlSec?: number
}

/**
 * Request body accepted by `POST {rootPath}` (draft submission). `uploads`
 * is an optional map of caller-named upload slots — for each slot the
 * server allocates a deterministic blob key
 * (`tasks/${taskId}/uploads/${name}`) and returns a presigned upload
 * URL. The response payload mirrors the keys back so the client can
 * patch them into the final `payload` it sends to
 * `POST {rootPath}/:id/start`.
 */
export type SubmitDraftRequest = {
  type: string
  payload: unknown
  handlerVersion: number
  idempotencyKey?: string
  /** ISO-8601 timestamp; the runner enqueues but holds dispatch until this point. */
  notBefore?: string
  tags?: string[]
  retentionPolicy?: Partial<TaskRetentionPolicy>
  uploads?: Record<
    string,
    {
      contentType?: string
      maxBytes?: number
      ttlSec?: number
    }
  >
}

/**
 * Response body for `POST {rootPath}`. `task` is the persisted draft;
 * `uploads` is keyed by slot name and contains the server-allocated
 * blob key plus the presigned URL/method/fields the client must use.
 */
export type SubmitDraftResponse = {
  task: Task
  uploads: Record<string, { key: string } & BlobUploadUrl>
}

/**
 * Request body accepted by `POST {rootPath}/:id/start`. `payload` is an
 * optional full replacement payload — typically the original draft
 * payload patched with the resolved blob keys returned by
 * `POST {rootPath}`.
 */
export type StartTaskRequest = {
  payload?: unknown
}

const SLOT_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/

const writeJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const writeError = (res: ServerResponse, status: number, code: string, message: string): void => {
  writeJson(res, status, { code, message })
}

const readJsonBody = async <T>(req: IncomingMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf-8')
    req.on('data', (chunk: string) => {
      data += chunk
    })
    req.on('end', () => {
      if (data.length === 0) {
        resolve({} as T)
        return
      }
      try {
        resolve(JSON.parse(data) as T)
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

const stripTrailingSlash = (s: string): string => (s.endsWith('/') ? s.slice(0, -1) : s)

type Match = { id: string; rest: string }

/** Strips `rootPath` from `pathname`. Returns `undefined` when not under the prefix. */
const stripRoot = (pathname: string, rootPath: string): string | undefined => {
  if (pathname === rootPath) return ''
  if (pathname.startsWith(`${rootPath}/`)) return pathname.slice(rootPath.length)
  return undefined
}

/** Captures `/${id}${rest}` where `rest` is empty or starts with `/`. */
const matchTaskId = (rest: string): Match | undefined => {
  const m = /^\/([^/]+)(.*)$/.exec(rest)
  if (!m) return undefined
  return { id: decodeURIComponent(m[1]), rest: m[2] }
}

/**
 * Builds a {@link ServerApi} that exposes the task-runner REST surface
 * (PRD §13 Milestone 2):
 *
 * - `POST {rootPath}` — create a draft task. Optional `uploads` mints
 *   presigned URLs for caller-named blob slots. The draft is **not**
 *   dispatched until `POST {rootPath}/:id/start`.
 * - `POST {rootPath}/:id/start` — release a draft to the queue,
 *   optionally replacing the payload. Returns the updated `Task`.
 * - `GET {rootPath}/:id` — return the current task row.
 * - `GET {rootPath}/:id/tree` — return parent + descendants.
 * - `DELETE {rootPath}/:id?reason=...` — cancel; cascades to descendants.
 * - `GET {rootPath}/:id/download` — 302 to a download URL for
 *   `producedBlobs[0]`.
 * - `GET {rootPath}/:id/blobs/:key` — 302 for an explicit produced blob.
 *
 * Authorization is enforced per route via the optional `authorizers`
 * map; unconfigured types fall back to "authenticated only".
 * `submittedBy` on created tasks is captured from the requester's
 * `IdentityContext`.
 *
 * Mounted via `useTaskRunnerEndpoints`; apps may also push the returned
 * `ServerApi` directly into a custom server pool record.
 */
export const buildTaskRunnerServerApi = (options: TaskRunnerServerApiOptions): ServerApi => {
  const rootPath = stripTrailingSlash(options.rootPath || '/tasks')
  const defaultUploadTtl = options.defaultUploadTtlSec ?? 3600
  const defaultDownloadTtl = options.defaultDownloadTtlSec ?? 3600
  const authorizers = options.authorizers ?? {}

  const captureSubmittedBy = async (req: IncomingMessage): Promise<string | undefined> => {
    try {
      const userContext = options.injector.get(HttpUserContext)
      const user = await userContext.getCurrentUser(req)
      return user?.username
    } catch {
      return undefined
    }
  }

  const enforce = async (
    req: IncomingMessage,
    res: ServerResponse,
    type: string,
    action: RouteAction,
  ): Promise<boolean> => {
    const result = await authorize({
      injector: options.injector,
      req,
      type,
      action,
      authorizers,
    })
    if (!result.ok) {
      writeError(res, result.status, result.code, result.message)
      return false
    }
    return true
  }

  const getRunner = (): TaskRunner => options.injector.get(TaskRunnerToken)
  const getBlobStore = (): BlobStore => options.injector.get(BlobStoreToken)

  const handlePostDraft = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    let body: SubmitDraftRequest
    try {
      body = await readJsonBody<SubmitDraftRequest>(req)
    } catch {
      writeError(res, 400, 'invalid-body', 'Request body must be valid JSON')
      return
    }
    if (typeof body.type !== 'string' || body.type.length === 0) {
      writeError(res, 400, 'invalid-body', 'Body.type must be a non-empty string')
      return
    }
    if (typeof body.handlerVersion !== 'number') {
      writeError(res, 400, 'invalid-body', 'Body.handlerVersion must be a number')
      return
    }
    if (body.uploads) {
      for (const name of Object.keys(body.uploads)) {
        if (!SLOT_NAME_PATTERN.test(name)) {
          writeError(res, 400, 'invalid-body', `Upload slot name '${name}' must match ${SLOT_NAME_PATTERN.source}`)
          return
        }
      }
    }

    if (!(await enforce(req, res, body.type, 'submit'))) return

    const submittedBy = await captureSubmittedBy(req)

    const draft = await getRunner().draft({
      type: body.type,
      payload: body.payload,
      handlerVersion: body.handlerVersion,
      idempotencyKey: body.idempotencyKey,
      notBefore: body.notBefore ? new Date(body.notBefore) : undefined,
      tags: body.tags,
      retentionPolicy: body.retentionPolicy,
      submittedBy,
    })

    const uploadResults: Record<string, { key: string } & BlobUploadUrl> = {}
    if (body.uploads) {
      const blobStore = getBlobStore()
      for (const [name, slot] of Object.entries(body.uploads)) {
        const key = `tasks/${draft.id}/uploads/${name}`
        try {
          const url = await blobStore.getUploadUrl(key, {
            ttlSec: slot.ttlSec ?? defaultUploadTtl,
            contentType: slot.contentType,
            maxBytes: slot.maxBytes,
          })
          uploadResults[name] = { key, ...url }
        } catch (error) {
          if (BlobStoreError.is(error) && error.code === 'capability-missing') {
            writeError(
              res,
              501,
              'capability-missing',
              'Bound BlobStore does not support presigned upload URLs; submit without `uploads` and pre-populate the payload.',
            )
            return
          }
          throw error
        }
      }
    }

    writeJson(res, 201, { task: draft, uploads: uploadResults } satisfies SubmitDraftResponse)
  }

  const handleStart = async (req: IncomingMessage, res: ServerResponse, taskId: string): Promise<void> => {
    let body: StartTaskRequest
    try {
      body = await readJsonBody<StartTaskRequest>(req)
    } catch {
      writeError(res, 400, 'invalid-body', 'Request body must be valid JSON when present')
      return
    }
    const task = await getRunner().get(taskId)
    if (!task) {
      writeError(res, 404, 'not-found', `Task ${taskId} not found`)
      return
    }
    if (!(await enforce(req, res, task.type, 'start'))) return
    try {
      const started =
        'payload' in body ? await getRunner().start(taskId, { payload: body.payload }) : await getRunner().start(taskId)
      writeJson(res, 200, started)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start task'
      writeError(res, 409, 'invalid-state', message)
    }
  }

  const handleGet = async (req: IncomingMessage, res: ServerResponse, taskId: string): Promise<void> => {
    const task = await getRunner().get(taskId)
    if (!task) {
      writeError(res, 404, 'not-found', `Task ${taskId} not found`)
      return
    }
    if (!(await enforce(req, res, task.type, 'get'))) return
    writeJson(res, 200, task)
  }

  const handleGetTree = async (req: IncomingMessage, res: ServerResponse, taskId: string): Promise<void> => {
    const task = await getRunner().get(taskId)
    if (!task) {
      writeError(res, 404, 'not-found', `Task ${taskId} not found`)
      return
    }
    if (!(await enforce(req, res, task.type, 'get'))) return
    const tree: TaskTreeNode = await getRunner().getTree(taskId)
    writeJson(res, 200, tree)
  }

  const handleDelete = async (
    req: IncomingMessage,
    res: ServerResponse,
    taskId: string,
    query: URLSearchParams,
  ): Promise<void> => {
    const task = await getRunner().get(taskId)
    if (!task) {
      writeError(res, 404, 'not-found', `Task ${taskId} not found`)
      return
    }
    if (!(await enforce(req, res, task.type, 'cancel'))) return
    const reason = query.get('reason') ?? undefined
    await getRunner().cancel(taskId, reason)
    res.writeHead(204)
    res.end()
  }

  const handleDownload = async (
    req: IncomingMessage,
    res: ServerResponse,
    taskId: string,
    explicitKey?: string,
  ): Promise<void> => {
    const task = await getRunner().get(taskId)
    if (!task) {
      writeError(res, 404, 'not-found', `Task ${taskId} not found`)
      return
    }
    if (!(await enforce(req, res, task.type, 'download'))) return
    if (!task.producedBlobs.length) {
      writeError(res, 404, 'not-found', `Task ${taskId} has no produced blobs`)
      return
    }
    let blobKey: string
    if (explicitKey) {
      const allowed = task.producedBlobs.some((b) => b.key === explicitKey)
      if (!allowed) {
        writeError(res, 404, 'not-found', `Blob ${explicitKey} is not produced by task ${taskId}`)
        return
      }
      blobKey = explicitKey
    } else {
      blobKey = task.producedBlobs[0].key
    }
    try {
      const url = await getBlobStore().getDownloadUrl(blobKey, { ttlSec: defaultDownloadTtl })
      res.writeHead(302, { Location: url })
      res.end()
    } catch (error) {
      if (BlobStoreError.is(error) && error.code === 'capability-missing') {
        writeError(res, 501, 'capability-missing', 'Bound BlobStore does not support presigned download URLs.')
        return
      }
      if (BlobStoreError.is(error) && error.code === 'not-found') {
        writeError(res, 404, 'not-found', `Blob ${blobKey} not found`)
        return
      }
      throw error
    }
  }

  const dispatch = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const tail = stripRoot(url.pathname, rootPath)
    if (tail === undefined) {
      writeError(res, 404, 'not-found', 'Route not handled')
      return
    }
    const method = req.method?.toUpperCase()

    if (tail === '' || tail === '/') {
      if (method === 'POST') return handlePostDraft(req, res)
      writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed for ${rootPath}`)
      return
    }

    const m = matchTaskId(tail)
    if (!m) {
      writeError(res, 404, 'not-found', 'Route not handled')
      return
    }

    if (m.rest === '' || m.rest === '/') {
      if (method === 'GET') return handleGet(req, res, m.id)
      if (method === 'DELETE') return handleDelete(req, res, m.id, url.searchParams)
      writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed`)
      return
    }
    if (m.rest === '/start') {
      if (method === 'POST') return handleStart(req, res, m.id)
      writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed`)
      return
    }
    if (m.rest === '/tree') {
      if (method === 'GET') return handleGetTree(req, res, m.id)
      writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed`)
      return
    }
    if (m.rest === '/download') {
      if (method === 'GET') return handleDownload(req, res, m.id)
      writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed`)
      return
    }
    if (m.rest.startsWith('/blobs/')) {
      if (method !== 'GET') {
        writeError(res, 405, 'method-not-allowed', `Method ${method ?? '<unknown>'} not allowed`)
        return
      }
      const key = decodeURIComponent(m.rest.slice('/blobs/'.length))
      return handleDownload(req, res, m.id, key)
    }

    writeError(res, 404, 'not-found', 'Route not handled')
  }

  return {
    shouldExec: ({ req }) => {
      if (!req.url) return false
      const cleanUrl = req.url.split('?')[0] ?? ''
      return cleanUrl === rootPath || cleanUrl.startsWith(`${rootPath}/`)
    },
    onRequest: async ({ req, res }) => {
      try {
        await dispatch(req, res)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unhandled error'
        writeError(res, 500, 'io-error', message)
      }
    },
  }
}
