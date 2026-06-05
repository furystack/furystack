import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInjector, type Injector } from '@furystack/inject'
import { BlobStore } from '@furystack/blob-store'
import { getPort } from '@furystack/core/port-generator'
import { defineFileSystemBlobStore } from '@furystack/filesystem-blob-store'
import { useFileSystemBlobStoreEndpoints } from '@furystack/filesystem-blob-store/endpoints'
import {
  defaultHttpAuthenticationSettings,
  HttpAuthenticationSettings,
  type AuthenticationProvider,
} from '@furystack/rest-service'
import { defineInProcessTaskRunner, TaskRunner } from '@furystack/task-runner'
import { useTaskRunnerEndpoints, type TaskAuthorizers } from '@furystack/task-runner/endpoints'
import type { User } from '@furystack/core'
import { videoEncoderHandlers } from './handlers/index.js'

const DEMO_SECRET = 'video-encoder-showcase-demo-secret-key'

const DEMO_USER: User = { username: 'demo-user', roles: ['user', 'admin'] }

/**
 * Authorizers exercising PRD §11 security: anyone authenticated may submit
 * and read, but only an `admin` may cancel.
 */
const DEMO_AUTHORIZERS: TaskAuthorizers = {
  'process-upload': { submit: ['user'], cancel: ['admin'] },
}

/** Running showcase server: an injector hosting the runner, workers, and REST/WS endpoints. */
export type VideoEncoderServer = {
  readonly injector: Injector
  readonly port: number
  readonly rootUrl: string
  readonly wsUrl: string
  readonly blobRoot: string
  [Symbol.asyncDispose](): Promise<void>
}

/** Options for {@link startVideoEncoderServer}. */
export type VideoEncoderServerOptions = {
  /** Port to listen on. Defaults to an auto-allocated free port. */
  port?: number
  /** Identity every request authenticates as. Pass `null` to simulate an anonymous caller. */
  user?: User | null
  /** Fleet cap on concurrent `video-encode-chunk` tasks (models GPU scarcity). Default 4. */
  chunkConcurrencyLimit?: number
  /** Worker slot count. Default 8. */
  workerConcurrency?: number
}

/**
 * Boots a self-contained, single-injector video-encoder showcase: a
 * filesystem blob store (with signed upload/download endpoints), an
 * in-process task runner, one worker hosting every pipeline handler, and
 * the task-runner REST + WS surface — all on one loopback HTTP server.
 *
 * The returned handle is async-disposable; disposing tears down the
 * server, runner, and the temporary blob directory.
 */
export const startVideoEncoderServer = async (options: VideoEncoderServerOptions = {}): Promise<VideoEncoderServer> => {
  const port = options.port ?? getPort()
  const user = options.user === undefined ? DEMO_USER : options.user
  const blobRoot = await mkdtemp(join(tmpdir(), 'video-encoder-blobs-'))

  const injector = createInjector()

  injector.bind(
    BlobStore,
    defineFileSystemBlobStore({
      root: blobRoot,
      secret: DEMO_SECRET,
      publicUrlBase: `http://localhost:${port}/blobs`,
    }),
  )

  injector.bind(
    TaskRunner,
    defineInProcessTaskRunner({
      concurrencyLimits: { 'video-encode-chunk': options.chunkConcurrencyLimit ?? 4 },
      reconcilerIntervalMs: 100,
      sweepIntervalMs: 100,
    }),
  )

  const provider: AuthenticationProvider = {
    name: 'demo-auth-provider',
    authenticate: async () => user,
  }
  injector.bind(HttpAuthenticationSettings, () => ({
    ...defaultHttpAuthenticationSettings(),
    authenticationProviders: [provider],
  }))

  injector.get(TaskRunner).registerWorker({
    name: 'video-encoder-worker',
    handlers: videoEncoderHandlers,
    concurrency: options.workerConcurrency ?? 8,
    tags: [],
    compatibleVersions: {},
  })

  await useFileSystemBlobStoreEndpoints({ injector, port, baseUrl: '/blobs', root: blobRoot, secret: DEMO_SECRET })
  await useTaskRunnerEndpoints({ injector, port, authorizers: DEMO_AUTHORIZERS })

  return {
    injector,
    port,
    rootUrl: `http://localhost:${port}/tasks`,
    wsUrl: `ws://localhost:${port}/tasks-socket`,
    blobRoot,
    async [Symbol.asyncDispose]() {
      await injector[Symbol.asyncDispose]()
      await rm(blobRoot, { recursive: true, force: true })
    },
  }
}
