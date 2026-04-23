import { createInjector, defineService, withScope } from '@furystack/inject'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsoleLogger, defaultFormat, verboseFormat } from './console-logger.js'
import { getLogger, useLogging, useScopedLogger } from './helpers.js'
import { LoggerCollection } from './logger-collection.js'
import type { LeveledLogEntry } from './log-entries.js'
import type { ScopedLogger } from './logger.js'
import { createTestLogger } from './test-logger.js'

describe('Loggers', () => {
  it('Can be set up and retrieved with a helper', async () => {
    const injector = createInjector()
    try {
      useLogging(injector)
      const collection = getLogger(injector)
      expect(collection).toBe(injector.get(LoggerCollection))
      expect(collection.getLoggers()).toEqual([])
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

  describe('LoggerCollection', () => {
    it('Is resolvable from the injector', async () => {
      const injector = createInjector()
      try {
        const loggers = injector.get(LoggerCollection)
        expect(typeof loggers.attachLogger).toBe('function')
        expect(typeof loggers.detach).toBe('function')
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('Attach and detach loggers', async () => {
      const injector = createInjector()
      try {
        const loggers = injector.get(LoggerCollection)
        const probe = createTestLogger(async () => undefined)
        loggers.attachLogger(probe)
        expect(loggers.getLoggers()).toContain(probe)
        loggers.detach(probe)
        expect(loggers.getLoggers()).not.toContain(probe)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('Should forward Verbose event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('verbose')
          doneCallback()
        }),
      )
      await loggers.verbose({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should forward Debug event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('debug')
          doneCallback()
        }),
      )
      await loggers.debug({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should forward Information event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('information')
          doneCallback()
        }),
      )
      await loggers.information({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should forward Warning event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('warning')
          doneCallback()
        }),
      )
      await loggers.warning({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should forward Error event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('error')
          doneCallback()
        }),
      )
      await loggers.error({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should raise an Error event if failed to insert below Error', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          if (e.level !== 'error' && e.level !== 'fatal') {
            throw new Error('Nooo')
          }
          expect(e.level).toBe('error')
          doneCallback()
        }),
      )
      await loggers.verbose({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should raise a Fatal event if failed to insert an Error', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          if (e.level !== 'fatal') {
            throw new Error('Nooo')
          }
          expect(e.level).toBe('fatal')
          doneCallback()
        }),
      )
      await loggers.verbose({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should forward Fatal event', async () => {
      const doneCallback = vi.fn()
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async (e) => {
          expect(e.level).toBe('fatal')
          doneCallback()
        }),
      )
      await loggers.fatal({ message: 'alma', scope: 'alma' })
      expect(doneCallback).toBeCalledTimes(1)
      await injector[Symbol.asyncDispose]()
    })

    it('Should not throw when fatal entry fails to persist', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const injector = createInjector()
      const loggers = injector.get(LoggerCollection)
      loggers.attachLogger(
        createTestLogger(async () => {
          throw new Error('persistence failure')
        }),
      )
      await expect(loggers.fatal({ message: 'critical', scope: 'test' })).resolves.toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist fatal log entry',
        expect.objectContaining({
          originalEntry: expect.any(Object) as object,
          error: expect.any(Error) as Error,
        }) as object,
      )
      consoleErrorSpy.mockRestore()
      await injector[Symbol.asyncDispose]()
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
        const probe = createTestLogger(async (entry) => {
          entries.push(entry)
        })
        injector.get(LoggerCollection).attachLogger(probe)

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
  })
})
