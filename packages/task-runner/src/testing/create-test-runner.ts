import { createInjector, type Injector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { TaskRunner } from '../task-runner.js'
import { defineInProcessTaskRunner, type InProcessTaskRunnerOptions } from '../in-process-task-runner.js'
import type { AnyTaskHandlerDescriptor } from '../define-task-handler.js'
import type { Worker } from '../task-runner.js'

export type TestRunnerOptions = InProcessTaskRunnerOptions & {
  handlers?: AnyTaskHandlerDescriptor[]
  workerConcurrency?: number
  compatibleVersions?: Record<string, number[]>
}

export type TestRunner = {
  readonly injector: Injector
  readonly runner: TaskRunner
  readonly worker?: Worker
  [Symbol.asyncDispose](): Promise<void>
}

/**
 * Creates a self-contained task runner with an in-memory store, in-process
 * bus, and optionally pre-registered handlers. Suitable for integration
 * tests that exercise multi-task DAG flows without external dependencies.
 */
export const createTestRunner = (options?: TestRunnerOptions): TestRunner => {
  const injector = createInjector()

  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'test-blobs' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  })

  injector.bind(
    TaskRunner,
    defineInProcessTaskRunner({
      reconcilerIntervalMs: options?.reconcilerIntervalMs ?? 100,
      sweepIntervalMs: options?.sweepIntervalMs ?? 100,
    }),
  )

  const runner = injector.get(TaskRunner)

  let worker: Worker | undefined
  if (options?.handlers?.length) {
    worker = runner.registerWorker({
      name: 'test-worker',
      handlers: options.handlers,
      concurrency: options.workerConcurrency ?? 4,
      tags: [],
      compatibleVersions: options.compatibleVersions ?? {},
    })
  }

  return {
    injector,
    runner,
    worker,
    async [Symbol.asyncDispose]() {
      await injector[Symbol.asyncDispose]()
    },
  }
}
