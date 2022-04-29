import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { getLogger, useLogging } from './helpers'
import { LogLevel } from './log-entries'
import { ConsoleLogger, verboseFormat, defaultFormat } from './console-logger'
import { LoggerCollection } from './logger-collection'
import { TestLogger } from './test-logger'

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

    it('Should forward Verbose event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Verbose)
          done()
        }),
      )
      loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should forward Debug event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Debug)
          done()
        }),
      )
      loggers.debug({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should forward Information event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Information)
          done()
        }),
      )
      loggers.information({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should forward Warning event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Warning)
          done()
        }),
      )
      loggers.warning({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should forward Error event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Error)
          done()
        }),
      )
      loggers.error({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should raise an Error event if failed to insert below Error', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          if (e.level < LogLevel.Error) {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe(LogLevel.Error)
            done()
          }
        }),
      )
      loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should raise a Fatal event if failed to insert an Error', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          if (e.level < LogLevel.Fatal) {
            throw new Error('Nooo')
          } else {
            expect(e.level).toBe(LogLevel.Fatal)
            done()
          }
        }),
      )
      loggers.verbose({
        message: 'alma',
        scope: 'alma',
      })
    })

    it('Should forward Fatal event', (done) => {
      const loggers = new LoggerCollection()
      loggers.attachLogger(
        new TestLogger(async (e) => {
          expect(e.level).toBe(LogLevel.Fatal)
          done()
        }),
      )
      loggers.fatal({
        message: 'alma',
        scope: 'alma',
      })
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
