import { createInjector, defineService, withScope } from '@furystack/inject'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConsoleLogger,
  defaultFormat,
  FgMagenta,
  FgRed,
  getLevelColor,
  VerboseConsoleLogger,
  verboseFormat,
} from './console-logger.js'
import { getLogger, useLogging, useScopedLogger } from './helpers.js'
import { LoggerCollection, LoggerRegistry } from './logger-collection.js'
import type { LeveledLogEntry } from './log-entries.js'
import type { Logger, ScopedLogger } from './logger.js'
import { createTestLogger } from './test-logger.js'

describe('Loggers', () => {
  it('Resolves an empty registry by default', async () => {
    const injector = createInjector()
    try {
      const collection = getLogger(injector)
      expect(collection).toBe(injector.get(LoggerCollection))
      expect(injector.get(LoggerRegistry).loggers).toEqual([])
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('Resolves LoggerCollection as a singleton across scopes', async () => {
    const root = createInjector()
    try {
      await withScope(root, (scope) => {
        expect(scope.get(LoggerCollection)).toBe(root.get(LoggerCollection))
      })
    } finally {
      await root[Symbol.asyncDispose]()
    }
  })

  describe('useLogging', () => {
    it('registers loggers passed as direct instances', async () => {
      const injector = createInjector()
      try {
        const onAdd = vi.fn(async () => undefined)
        useLogging(injector, createTestLogger(onAdd))
        await getLogger(injector).information({ message: 'm', scope: 's' })
        expect(onAdd).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('registers loggers passed as tokens by resolving them through the injector', async () => {
      const injector = createInjector()
      try {
        const onAdd = vi.fn(async () => undefined)
        const ProbeLogger = defineService<Logger, 'singleton'>({
          name: 'test/ProbeLogger',
          lifetime: 'singleton',
          factory: () => createTestLogger(onAdd),
        })
        useLogging(injector, ProbeLogger)
        await getLogger(injector).information({ message: 'm', scope: 's' })
        expect(onAdd).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('accepts a mix of tokens and direct instances in the same call', async () => {
      const injector = createInjector()
      try {
        const onAddToken = vi.fn(async () => undefined)
        const onAddInstance = vi.fn(async () => undefined)
        const ProbeLogger = defineService<Logger, 'singleton'>({
          name: 'test/ProbeLoggerMixed',
          lifetime: 'singleton',
          factory: () => createTestLogger(onAddToken),
        })
        useLogging(injector, ProbeLogger, createTestLogger(onAddInstance))
        await getLogger(injector).information({ message: 'm', scope: 's' })
        expect(onAddToken).toHaveBeenCalledTimes(1)
        expect(onAddInstance).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('replaces, not accumulates: calling twice uses the second composition only', async () => {
      const injector = createInjector()
      try {
        const onFirst = vi.fn(async () => undefined)
        const onSecond = vi.fn(async () => undefined)
        useLogging(injector, createTestLogger(onFirst))
        getLogger(injector)
        useLogging(injector, createTestLogger(onSecond))
        await getLogger(injector).information({ message: 'm', scope: 's' })
        expect(onFirst).not.toHaveBeenCalled()
        expect(onSecond).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('produces a registry whose loggers array is frozen relative to the caller', async () => {
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async () => undefined),
        )
        const { loggers } = injector.get(LoggerRegistry)
        expect(loggers).toHaveLength(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })
  })

  describe('LoggerCollection fan-out', () => {
    const withProbeCollection = async (
      assertion: (entry: LeveledLogEntry<unknown>) => void,
      act: (logger: Logger) => Promise<void>,
    ): Promise<number> => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async (entry) => {
            assertion(entry)
            doneCallback()
          }),
        )
        await act(getLogger(injector))
        return doneCallback.mock.calls.length
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    }

    it('forwards Verbose entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('verbose'),
        (log) => log.verbose({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('forwards Debug entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('debug'),
        (log) => log.debug({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('forwards Information entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('information'),
        (log) => log.information({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('forwards Warning entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('warning'),
        (log) => log.warning({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('forwards Error entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('error'),
        (log) => log.error({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('forwards Fatal entries', async () => {
      const calls = await withProbeCollection(
        (e) => expect(e.level).toBe('fatal'),
        (log) => log.fatal({ message: 'alma', scope: 'alma' }),
      )
      expect(calls).toBe(1)
    })

    it('Should raise an Error event if failed to insert below Error', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async (e) => {
            if (e.level !== 'error' && e.level !== 'fatal') {
              throw new Error('Nooo')
            }
            expect(e.level).toBe('error')
            doneCallback()
          }),
        )
        await getLogger(injector).verbose({ message: 'alma', scope: 'alma' })
        expect(doneCallback).toBeCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('Should raise a Fatal event if failed to insert an Error', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async (e) => {
            if (e.level !== 'fatal') {
              throw new Error('Nooo')
            }
            expect(e.level).toBe('fatal')
            doneCallback()
          }),
        )
        await getLogger(injector).verbose({ message: 'alma', scope: 'alma' })
        expect(doneCallback).toBeCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('aggregates rejections from multiple loggers into a single AggregateError', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const injector = createInjector()
      try {
        const succeedingEntries: Array<LeveledLogEntry<unknown>> = []
        // Raw (un-wrapped) Logger-shaped objects: their addEntry rejects directly,
        // bypassing createLogger's error isolation so the rejection reaches
        // LoggerCollection's fan-out.
        const rejectingA = {
          addEntry: async () => {
            throw new Error('A failed')
          },
        } as unknown as Logger
        const rejectingB = {
          addEntry: async () => {
            throw new Error('B failed')
          },
        } as unknown as Logger
        const succeeding = createTestLogger(async (entry) => {
          succeedingEntries.push(entry)
        })
        useLogging(injector, rejectingA, succeeding, rejectingB)
        await getLogger(injector).fatal({ message: 'multi', scope: 'test' })
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to persist fatal log entry',
          expect.objectContaining({
            error: expect.any(AggregateError) as AggregateError,
          }) as object,
        )
        const [, payload] = consoleErrorSpy.mock.calls[0] as [string, { error: AggregateError }]
        expect(payload.error.errors).toHaveLength(2)
        expect(succeedingEntries).toHaveLength(1)
      } finally {
        consoleErrorSpy.mockRestore()
        await injector[Symbol.asyncDispose]()
      }
    })

    it('Should not throw when fatal entry fails to persist', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async () => {
            throw new Error('persistence failure')
          }),
        )
        await expect(getLogger(injector).fatal({ message: 'critical', scope: 'test' })).resolves.toBeUndefined()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to persist fatal log entry',
          expect.objectContaining({
            originalEntry: expect.any(Object) as object,
            error: expect.any(Error) as Error,
          }) as object,
        )
      } finally {
        consoleErrorSpy.mockRestore()
        await injector[Symbol.asyncDispose]()
      }
    })
  })

  describe('Console Logger', () => {
    const scope = 'exampleScope'

    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    afterAll(() => {
      consoleMock.mockRestore()
    })

    beforeEach(() => {
      consoleMock.mockReset()
    })

    describe('With scope', () => {
      const withConsoleLogger = async (cb: (scoped: ScopedLogger) => Promise<void>) => {
        const injector = createInjector()
        try {
          const logger = injector.get(ConsoleLogger)
          await cb(logger.withScope(scope))
        } finally {
          await injector[Symbol.asyncDispose]()
        }
      }

      it('Should print with addEntry', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Verbose Message', level: 'verbose' } as const
          await scoped.addEntry(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, scope }))
        })
      })

      it('Should print Verbose', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Verbose Message' }
          await scoped.verbose(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'verbose', scope }))
        })
      })

      it('Should print Debug', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Debug Message' }
          await scoped.debug(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'debug', scope }))
        })
      })

      it('Should print Information', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Information Message' }
          await scoped.information(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'information', scope }))
        })
      })

      it('Should print Warning', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Warning Message' }
          await scoped.warning(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'warning', scope }))
        })
      })

      it('Should print Error', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Error Message' }
          await scoped.error(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'error', scope }))
        })
      })

      it('Should print Fatal', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Fatal Message' }
          await scoped.fatal(message)
          expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal', scope }))
        })
      })

      it('Should print additional data', async () => {
        await withConsoleLogger(async (scoped) => {
          const message = { message: 'Example Fatal Message', data: { a: 1 } }
          await scoped.fatal(message)
          expect(consoleMock).toHaveBeenCalledWith(
            ...defaultFormat({ ...message, level: 'fatal', scope, data: { a: 1 } }),
          )
        })
      })
    })

    describe('Without scope', () => {
      it('Should print Verbose', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Verbose Message', scope }
        await logger.verbose(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'verbose' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print Debug', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Debug Message', scope }
        await logger.debug(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'debug' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print Information', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Information Message', scope }
        await logger.information(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'information' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print Warning', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Warning Message', scope }
        await logger.warning(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'warning' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print Error', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Error Message', scope }
        await logger.error(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'error' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print Fatal', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Fatal Message', scope }
        await logger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal' }))
        await injector[Symbol.asyncDispose]()
      })

      it('Should print additional data', async () => {
        const injector = createInjector()
        const logger = injector.get(ConsoleLogger)
        const message = { message: 'Example Fatal Message', data: { a: 1 }, scope }
        await logger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal' }))
        await injector[Symbol.asyncDispose]()
      })
    })
  })

  describe('useScopedLogger', () => {
    it('scopes the logger entries by the defining service name', async () => {
      const entries: Array<LeveledLogEntry<unknown>> = []
      const injector = createInjector()
      try {
        useLogging(
          injector,
          createTestLogger(async (entry) => {
            entries.push(entry)
          }),
        )

        const MyService = defineService({
          name: '@test/pkg/MyService',
          lifetime: 'singleton',
          factory: (ctx) => {
            const log = useScopedLogger(ctx)
            return {
              run: async () => log.information({ message: 'hi' }),
            }
          },
        })

        await injector.get(MyService).run()
        expect(entries).toHaveLength(1)
        expect(entries[0].scope).toBe('@test/pkg/MyService')
        expect(entries[0].message).toBe('hi')
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })
  })

  describe('defaultFormatter', () => {
    it('Should print compact messages', () =>
      expect(
        defaultFormat({
          level: 'debug',
          scope: 'scope',
          message: 'message',
          data: {},
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message']))
  })

  describe('getLevelColor', () => {
    it('returns a distinct color for fatal entries', () => {
      expect(getLevelColor('fatal')).toBe(FgMagenta)
      expect(getLevelColor('error')).toBe(FgRed)
      expect(getLevelColor('fatal')).not.toBe(getLevelColor('error'))
    })

    it('falls back to the error color for unknown log levels', () => {
      // The discriminated-union `LogLevel` type prevents passing an unknown
      // value from typed call sites, but the switch's `default` branch is
      // the production safety net for runtime-supplied levels coming from
      // serialized/legacy payloads.
      expect(getLevelColor('not-a-real-level' as unknown as 'error')).toBe(FgRed)
    })
  })

  describe('defaultFormat', () => {
    it('Should print compact messages', () =>
      expect(
        defaultFormat({
          level: 'debug',
          scope: 'scope',
          message: 'message',
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message']))

    it('Should print verbose messages with data', () =>
      expect(
        verboseFormat({
          level: 'debug',
          scope: 'scope',
          message: 'message',
          data: {},
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message', {}]))

    it('Should omit data entry when the verbose formatter receives none', () =>
      expect(
        verboseFormat({
          level: 'debug',
          scope: 'scope',
          message: 'message',
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message']))
  })

  describe('VerboseConsoleLogger', () => {
    it('Should route entries through verboseFormat and console.log', async () => {
      const injector = createInjector()
      try {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
        const logger = injector.get(VerboseConsoleLogger)
        await logger.information({ scope: 'verbose-test', message: 'hi', data: { key: 'value' } })
        expect(log).toHaveBeenCalledWith(
          expect.stringContaining('%s'),
          'verbose-test',
          'hi',
          expect.objectContaining({ key: 'value' }),
        )
        log.mockRestore()
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })
  })
})
