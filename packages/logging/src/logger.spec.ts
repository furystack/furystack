import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { getLogger, useLogging } from './helpers'
import { LogLevel } from './log-entries'
import { ConsoleLogger, verboseFormat, defaultFormat } from './console-logger'
import { LoggerCollection } from './logger-collection'
import { TestLogger } from './test-logger'
import { describe, it, expect, vi } from 'vitest'

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
          expect(e.level).toBe(LogLevel.Verbose)
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
          expect(e.level).toBe(LogLevel.Debug)
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
          expect(e.level).toBe(LogLevel.Information)
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
          expect(e.level).toBe(LogLevel.Warning)
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
          expect(e.level).toBe(LogLevel.Error)
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
          if (e.level < LogLevel.Error) {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe(LogLevel.Error)
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
          if (e.level < LogLevel.Fatal) {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe(LogLevel.Fatal)
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
          expect(e.level).toBe(LogLevel.Fatal)
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

  describe('Scoped Logger', () => {
    const scopedConsoleLogger = new ConsoleLogger().withScope('scope')
    it('Should print with addEntry', () =>
      scopedConsoleLogger.addEntry({ message: 'Example Verbose Message', level: LogLevel.Verbose }))
    it('Should print Verbose', () => scopedConsoleLogger.verbose({ message: 'Example Verbose Message' }))
    it('Should print Debug', () => scopedConsoleLogger.debug({ message: 'Example Debug Message' }))
    it('Should print Information', () => scopedConsoleLogger.information({ message: 'Example Information Message' }))
    it('Should print Warning', () => scopedConsoleLogger.warning({ message: 'Example Warning Message' }))
    it('Should print Error', () => scopedConsoleLogger.error({ message: 'Example Error Message' }))
    it('Should print Fatal', () => scopedConsoleLogger.fatal({ message: 'Example Fatal Message' }))
    it('Should print additional data', () =>
      scopedConsoleLogger.fatal({ message: 'Example Fatal Message', data: { a: 1 } }))
  })

  describe('ConsoleLogger', () => {
    const consoleLogger = new ConsoleLogger()
    it('Should print Verbose', () => consoleLogger.verbose({ scope: 'scope', message: 'Example Verbose Message' }))
    it('Should print Debug', () => consoleLogger.debug({ scope: 'scope', message: 'Example Debug Message' }))
    it('Should print Information', () =>
      consoleLogger.information({ scope: 'scope', message: 'Example Information Message' }))
    it('Should print Warning', () => consoleLogger.warning({ scope: 'scope', message: 'Example Warning Message' }))
    it('Should print Error', () => consoleLogger.error({ scope: 'scope', message: 'Example Error Message' }))
    it('Should print Fatal', () => consoleLogger.fatal({ scope: 'scope', message: 'Example Fatal Message' }))

    it('Should print additional data', () =>
      consoleLogger.fatal({ scope: 'scope', message: 'Example Fatal Message', data: { a: 1 } }))
  })

  describe('defaultFormatter', () => {
    it('Should print compact messages', () =>
      expect(
        defaultFormat({
          level: LogLevel.Debug,
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
          level: LogLevel.Debug,
          scope: 'scope',
          message: 'message',
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message']))

    it('Should print verbose messages with data', () =>
      expect(
        verboseFormat({
          level: LogLevel.Debug,
          scope: 'scope',
          message: 'message',
          data: {},
        }),
      ).toEqual(['\u001b[34m%s\u001b[0m', 'scope', 'message', {}]))
  })
})
