import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { CrossNodeBus, defineInProcessCrossNodeBus } from '@furystack/cross-node-bus'
import { createInjector } from '@furystack/inject'
import { TaskRunner } from '@furystack/task-runner'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { defineRedisTaskRunner } from './define-redis-task-runner.js'
import { RedisTaskRunner } from './redis-task-runner.js'

type RedisClientArg = Parameters<typeof defineRedisTaskRunner>[0]['client']

/**
 * Minimal stand-in for the `redis` client. The adapter only touches the
 * client lazily (it `duplicate()`s + `connect()`s a read client on
 * construction and issues stream commands on enqueue/subscribe), so a
 * service-less unit run can exercise the runner end to end without a
 * live broker. `duplicate()` returns the same mock so dispose assertions
 * observe the read client teardown.
 */
const buildMockClient = () => {
  const client = {
    xAdd: vi.fn().mockResolvedValue('1-0'),
    xGroupCreate: vi.fn().mockResolvedValue('OK'),
    xReadGroup: vi.fn().mockResolvedValue(null),
    xAutoClaim: vi.fn().mockResolvedValue({ nextId: '0-0', messages: [] }),
    xAck: vi.fn().mockResolvedValue(1),
    xClaimJustId: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    zAdd: vi.fn().mockResolvedValue(1),
    zRem: vi.fn().mockResolvedValue(1),
    eval: vi.fn().mockResolvedValue(0),
    isOpen: true,
    destroy: vi.fn(),
    duplicate: vi.fn(),
    connect: vi.fn(),
  }
  client.duplicate = vi.fn(() => client)
  client.connect = vi.fn().mockResolvedValue(client)
  return client
}

const bindRunner = (injector: ReturnType<typeof createInjector>, client: ReturnType<typeof buildMockClient>): void => {
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'unit-blobs' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(CrossNodeBus, defineInProcessCrossNodeBus())
  injector.bind(
    TaskRunner,
    defineRedisTaskRunner({
      client: client as unknown as RedisClientArg,
      serviceName: 'unit',
      topicPrefix: 'unit/',
      // Park the background timers so the unit run does not tick the
      // reconciler/scheduler against the mock broker.
      reconcilerIntervalMs: 1_000_000,
      sweepIntervalMs: 1_000_000,
      schedulerIntervalMs: 1_000_000,
    }),
  )
}

describe('@furystack/redis-task-runner', () => {
  describe('defineRedisTaskRunner', () => {
    it('resolves a RedisTaskRunner with Redis-backed capabilities', async () => {
      await usingAsync(createInjector(), async (injector) => {
        bindRunner(injector, buildMockClient())
        const runner = injector.get(TaskRunner)

        expect(runner).toBeInstanceOf(RedisTaskRunner)
        expect(runner.capabilities.persistent).toBe(true)
        expect(runner.capabilities.fleetCapEnforcement).toBe(true)
        expect(runner.capabilities.delayedDispatch).toBe(true)
        expect(runner.capabilities.maxPayloadBytes).toBe(Infinity)
      })
    })

    it('tears down the duplicated read client when the owning injector is disposed', async () => {
      const client = buildMockClient()
      await usingAsync(createInjector(), async (injector) => {
        bindRunner(injector, client)
        injector.get(TaskRunner)
      })

      // duplicate() is called once for the dedicated read connection, which
      // is force-closed via destroy() on dispose.
      expect(client.duplicate).toHaveBeenCalledTimes(1)
      expect(client.destroy).toHaveBeenCalledTimes(1)
    })

    it('routes submit() onto the per-(type,version) Redis stream', async () => {
      const client = buildMockClient()
      await usingAsync(createInjector(), async (injector) => {
        bindRunner(injector, client)
        const runner = injector.get(TaskRunner)

        const task = await runner.submit({ type: 'echo', payload: { value: 'hi' }, handlerVersion: 1 })

        expect(client.xAdd).toHaveBeenCalledWith('unit/tasks:queue:echo:v1', '*', {
          taskId: task.id,
          type: 'echo',
          handlerVersion: '1',
        })
      })
    })
  })
})
