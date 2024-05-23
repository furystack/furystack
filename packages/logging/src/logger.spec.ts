import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { getLogger, useLogging } from './helpers.js'
import { ConsoleLogger, verboseFormat, defaultFormat } from './console-logger.js'
import { LoggerCollection } from './logger-collection.js'
import { TestLogger } from './test-logger.js'
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest'

describe('Loggers', () => {
  it('Can be set up and retrieved with a helper', () => {
    using(new Injector(), (i) => {
      useLogging(i)
      expect(getLogger(i)).toBeInstanceOf(LoggerCollection)
    })
  })

  describe('LoggerCollection', () => {
    it('Should be constructed', () => {
      const loggers = new LoggerCollection()
      expect(loggers).toBeInstanceOf(LoggerCollection)
    })

    it('Should forward Verbose event', async () => {
      const doneCallback = vi.fn()
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('verbose')
          doneCallback()
        }),
      )
      await loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should forward Debug event', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()

      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('debug')
          doneCallback()
        }),
      )
      await loggers.debug({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should forward Information event', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('information')
          doneCallback()
        }),
      )
      await loggers.information({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should forward Warning event', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('warning')
          doneCallback()
        }),
      )
      await loggers.warning({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should forward Error event', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('error')
          doneCallback()
        }),
      )
      await loggers.error({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should raise an Error event if failed to insert below Error', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          if (e.level < 'error') {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe('error')
            doneCallback()
          }
        }),
      )
      await loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should raise a Fatal event if failed to insert an Error', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          if (e.level < 'fatal') {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe('fatal')
            doneCallback()
          }
        }),
      )
      await loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('Should forward Fatal event', async () => {
      const loggers = new LoggerCollection()
      const doneCallback = vi.fn()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe('fatal')
          doneCallback()
        }),
      )
      await loggers.fatal({
        message: 'alma',
        scope: 'alma',
      })
      expect(doneCallback).toBeCalledTimes(1)
    })
  })

  describe('Console Logger', () => {
    const scope = 'exampleScope'

    const scopedConsoleLogger = new ConsoleLogger().withScope(scope)
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => {})

    afterAll(() => {
      consoleMock.mockRestore()
    })

    beforeEach(() => {
      consoleMock.mockReset()
    })

    describe('With scope', () => {
      it('Should print with addEntry', async () => {
        const message = { message: 'Example Verbose Message', level: 'verbose' } as const
        await scopedConsoleLogger.addEntry(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, scope }))
      })

      it('Should print Verbose', async () => {
        const message = { message: 'Example Verbose Message' }
        await scopedConsoleLogger.verbose(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'verbose', scope }))
      })
      it('Should print Debug', async () => {
        const message = { message: 'Example Debug Message' }
        await scopedConsoleLogger.debug(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'debug', scope }))
      })
      it('Should print Information', async () => {
        const message = { message: 'Example Information Message' }
        await scopedConsoleLogger.information(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'information', scope }))
      })
      it('Should print Warning', async () => {
        const message = { message: 'Example Warning Message' }
        await scopedConsoleLogger.warning(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'warning', scope }))
      })
      it('Should print Error', async () => {
        const message = { message: 'Example Error Message' }
        await scopedConsoleLogger.error(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'error', scope }))
      })
      it('Should print Fatal', async () => {
        const message = { message: 'Example Fatal Message' }
        await scopedConsoleLogger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal', scope }))
      })
      it('Should print additional data', async () => {
        const message = { message: 'Example Fatal Message', data: { a: 1 } }
        await scopedConsoleLogger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(
          ...defaultFormat({ ...message, level: 'fatal', scope, data: { a: 1 } }),
        )
      })
    })

    describe('Without scope', () => {
      const consoleLogger = new ConsoleLogger()
      it('Should print Verbose', async () => {
        const message = { message: 'Example Verbose Message', scope }
        await consoleLogger.verbose(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'verbose' }))
      })
      it('Should print Debug', async () => {
        const message = { message: 'Example Debug Message', scope }
        await consoleLogger.debug(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'debug' }))
      })
      it('Should print Information', async () => {
        const message = { message: 'Example Information Message', scope }
        await consoleLogger.information(message)
      })
      it('Should print Warning', async () => {
        const message = { message: 'Example Warning Message', scope }
        await consoleLogger.warning(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'warning' }))
      })
      it('Should print Error', async () => {
        const message = { message: 'Example Error Message', scope }
        await consoleLogger.error(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'error' }))
      })
      it('Should print Fatal', async () => {
        const message = { message: 'Example Fatal Message', scope }
        await consoleLogger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal' }))
      })
      it('Should print additional data', async () => {
        const message = { message: 'Example Fatal Message', data: { a: 1 }, scope }
        await consoleLogger.fatal(message)
        expect(consoleMock).toHaveBeenCalledWith(...defaultFormat({ ...message, level: 'fatal' }))
      })
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
