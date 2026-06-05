import type { Injector } from '@furystack/inject'
import { HttpServerPoolToken, type ServerApi } from '@furystack/rest-service'
import { useWebSocketApi, type WebSocketApi } from '@furystack/websocket-api'
import {
  buildTaskRunnerServerApi,
  type TaskAuthorizers,
  type TaskRunnerServerApiOptions,
} from './build-task-runner-server-api.js'
import { createSubscribeTaskAction } from './subscribe-task-action.js'

/**
 * Options accepted by {@link useTaskRunnerEndpoints}.
 */
export type UseTaskRunnerEndpointsOptions = {
  /** Owning injector. The helper resolves the HTTP server pool, runner, and blob store from this injector. */
  injector: Injector
  /** Port of the pooled HTTP server. */
  port: number
  /** Optional host name; defaults to `localhost`. */
  hostName?: string
  /** REST root path. Defaults to `'/tasks'`. */
  rootPath?: string
  /** WebSocket path the subscribe endpoint answers on. Defaults to `'/tasks-socket'`. */
  wsPath?: string
  /** Per-task-type authorizer map. Used by REST and the subscribe action. */
  authorizers?: TaskAuthorizers
  /** Forwarded to {@link buildTaskRunnerServerApi}. */
  defaultUploadTtlSec?: TaskRunnerServerApiOptions['defaultUploadTtlSec']
  /** Forwarded to {@link buildTaskRunnerServerApi}. */
  defaultDownloadTtlSec?: TaskRunnerServerApiOptions['defaultDownloadTtlSec']
}

/**
 * Handle returned by {@link useTaskRunnerEndpoints}. Exposes the registered
 * `ServerApi` and the underlying {@link WebSocketApi} so callers can
 * inspect connection state, broadcast, or remove the registration from
 * the pool record.
 */
export type TaskRunnerEndpoints = {
  readonly serverApi: ServerApi
  readonly websocket: WebSocketApi
}

/**
 * Acquires (or reuses) a pooled HTTP server for `port`/`hostName` and
 * mounts:
 *
 * - The task-runner REST `ServerApi` (see {@link buildTaskRunnerServerApi})
 *   under `rootPath` (default `'/tasks'`).
 * - A websocket endpoint at `wsPath` (default `'/tasks-socket'`) carrying
 *   the {@link createSubscribeTaskAction subscribe action} for live task
 *   updates per PRD §7.7.
 *
 * Disposal of the websocket endpoint is tied to the owning injector
 * scope; the REST `ServerApi` is registered on the pool record and stays
 * for the lifetime of the pool. Callers wanting earlier teardown remove
 * the returned `serverApi` from `record.apis` manually.
 */
export const useTaskRunnerEndpoints = async (options: UseTaskRunnerEndpointsOptions): Promise<TaskRunnerEndpoints> => {
  const {
    injector,
    port,
    hostName,
    rootPath = '/tasks',
    wsPath = '/tasks-socket',
    authorizers,
    defaultUploadTtlSec,
    defaultDownloadTtlSec,
  } = options

  const pool = injector.get(HttpServerPoolToken)
  const record = await pool.acquire({ port, hostName })

  const serverApi = buildTaskRunnerServerApi({
    injector,
    rootPath,
    authorizers,
    defaultUploadTtlSec,
    defaultDownloadTtlSec,
  })
  record.apis.push(serverApi)

  const websocket = await useWebSocketApi({
    injector,
    port,
    hostName,
    path: wsPath,
    actions: [createSubscribeTaskAction({ authorizers })],
  })

  return { serverApi, websocket }
}
