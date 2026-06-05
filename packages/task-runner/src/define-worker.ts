import { defineService, type Token } from '@furystack/inject'
import type { AnyTaskHandlerDescriptor } from './define-task-handler.js'
import { TaskRunner, type Worker } from './task-runner.js'

/**
 * Options for {@link defineWorker}. `tags` gate which tasks this worker may
 * claim (a worker claims a task only when its tags ⊇ the task's tags);
 * `compatibleVersions` maps each task `type` to the handler versions this
 * worker accepts.
 */
export type WorkerOptions = {
  name: string
  types: AnyTaskHandlerDescriptor[]
  concurrency?: number
  tags?: string[]
  compatibleVersions?: Record<string, number[]>
}

/**
 * Defines a worker as a singleton DI token. Resolving the token registers
 * the worker's handlers with the bound {@link TaskRunner} and starts
 * claiming tasks; disposing the injector drains and unregisters it.
 *
 * @example
 * ```typescript
 * import { createInjector } from '@furystack/inject'
 * import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
 * import { TaskRunner, defineInProcessTaskRunner, defineTaskHandler, defineWorker } from '@furystack/task-runner'
 *
 * const encodeHandler = defineTaskHandler({ type: 'video-encode', version: 1, handler: async () => ({}) })
 * const probeHandler = defineTaskHandler({ type: 'video-probe', version: 1, handler: async () => ({}) })
 *
 * const VideoEncoder = defineWorker({
 *   name: 'my-app/VideoEncoder',
 *   types: [encodeHandler, probeHandler],
 *   concurrency: 4,
 *   tags: ['gpu'],
 *   compatibleVersions: { 'video-encode': [1, 2] },
 * })
 *
 * await using injector = createInjector()
 * injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'blobs' }))
 * injector.bind(TaskRunner, defineInProcessTaskRunner())
 * injector.get(VideoEncoder)
 * ```
 */
export const defineWorker = (options: WorkerOptions): Token<Worker, 'singleton'> =>
  defineService({
    name: options.name,
    lifetime: 'singleton',
    factory: ({ inject, onDispose }) => {
      const runner = inject(TaskRunner)
      const worker = runner.registerWorker({
        name: options.name,
        handlers: options.types,
        concurrency: options.concurrency ?? 1,
        tags: options.tags ?? [],
        compatibleVersions: options.compatibleVersions ?? {},
      })
      onDispose(() => worker[Symbol.dispose]())
      return worker
    },
  })
