import { defineService, type Token } from '@furystack/inject'
import { TaskRunnerClient, type TaskRunnerClientOptions } from './task-runner-client.js'

/**
 * Mints an application-specific DI token for a {@link TaskRunnerClient}
 * configured with the supplied options. Mirrors `defineEntitySyncService`
 * in `@furystack/entity-sync-client` — declare the token once at module
 * scope, then resolve it through the injector wherever a task client is
 * needed.
 *
 * The factory instantiates the client on first resolution and registers
 * `onDispose` so the shared WS transport is torn down with the owning
 * injector.
 *
 * @example
 * ```ts
 * import { createInjector } from '@furystack/inject'
 * import { defineTaskRunnerClient } from '@furystack/task-runner-client'
 *
 * const AppTasks = defineTaskRunnerClient({
 *   rootUrl: 'http://localhost:3000/tasks',
 *   wsUrl: 'ws://localhost:3000/tasks-socket',
 * })
 *
 * await using injector = createInjector()
 * const client = injector.get(AppTasks)
 * const task = await client.submitTask({ type: 'echo', payload: { value: 'hi' }, handlerVersion: 1 })
 * ```
 */
export const defineTaskRunnerClient = (options: TaskRunnerClientOptions): Token<TaskRunnerClient, 'singleton'> =>
  defineService({
    name: `furystack/task-runner-client/TaskRunnerClient[${options.rootUrl}]`,
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const client = new TaskRunnerClient(options)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      onDispose(() => client[Symbol.dispose]())
      return client
    },
  })
