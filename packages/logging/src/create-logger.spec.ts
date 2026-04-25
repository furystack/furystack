import { describe, expect, it, vi } from 'vitest'
import { createLogger, LoggerScope, type LoggerBackend } from './create-logger.js'
import type { LeveledLogEntry } from './log-entries.js'

describe('createLogger', () => {
  it('Should forward every level through the backend with the correct discriminator', async () => {
    const backend = vi.fn<LoggerBackend>(async () => undefined)
    const logger = createLogger(backend)
    await logger.verbose({ scope: 's', message: 'v' })
    await logger.debug({ scope: 's', message: 'd' })
    await logger.information({ scope: 's', message: 'i' })
    await logger.warning({ scope: 's', message: 'w' })
    await logger.error({ scope: 's', message: 'e' })
    await logger.fatal({ scope: 's', message: 'f' })

    const levels = backend.mock.calls.map(([entry]) => entry.level)
    expect(levels).toEqual(['verbose', 'debug', 'information', 'warning', 'error', 'fatal'])
  })

  it('Should escalate a sub-error failure into a new error entry', async () => {
    const persisted: Array<LeveledLogEntry<unknown>> = []
    const backend = vi.fn<LoggerBackend>(async (entry) => {
      if (entry.level === 'verbose') {
        throw new Error('verbose backend down')
      }
      persisted.push(entry)
    })
    const logger = createLogger(backend)

    await logger.verbose({ scope: 'src', message: 'first' })

    expect(persisted).toHaveLength(1)
    expect(persisted[0].level).toBe('error')
    expect(persisted[0].scope).toBe(LoggerScope)
    expect(persisted[0].message).toMatch(/There was an error adding entry/)
    const data = persisted[0].data as { entry: LeveledLogEntry<unknown>; error: Error }
    expect(data.entry.level).toBe('verbose')
    expect(data.error.message).toBe('verbose backend down')
  })

  it('Should escalate a failed error entry into a fatal entry', async () => {
    const persisted: Array<LeveledLogEntry<unknown>> = []
    const backend = vi.fn<LoggerBackend>(async (entry) => {
      if (entry.level === 'error') {
        throw new Error('error backend down')
      }
      persisted.push(entry)
    })
    const logger = createLogger(backend)

    await logger.error({ scope: 'src', message: 'original' })

    expect(persisted).toHaveLength(1)
    expect(persisted[0].level).toBe('fatal')
    expect(persisted[0].scope).toBe(LoggerScope)
    expect(persisted[0].message).toMatch(/elevated to Fatal level/i)
  })

  it('Should fall back to console.error when the fatal branch itself fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const originalError = new Error('fatal backend down')
    try {
      const logger = createLogger(async () => {
        throw originalError
      })

      await logger.fatal({ scope: 'src', message: 'end of the line' })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist fatal log entry',
        expect.objectContaining({
          originalEntry: expect.objectContaining({ level: 'fatal', message: 'end of the line' }) as object,
          error: originalError,
        }) as object,
      )
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('Should return a ScopedLogger from withScope that injects the scope into every entry', async () => {
    const persisted: Array<LeveledLogEntry<unknown>> = []
    const logger = createLogger(async (entry) => {
      persisted.push(entry)
    })
    const scoped = logger.withScope('my-service')

    await scoped.verbose({ message: 'hello' })
    await scoped.addEntry({ level: 'warning', message: 'raw' })

    expect(persisted.map((e) => [e.scope, e.level])).toEqual([
      ['my-service', 'verbose'],
      ['my-service', 'warning'],
    ])
  })
})
