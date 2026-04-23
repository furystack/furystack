import { createInjector, InjectorDisposedError } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { getCurrentUser, isAuthenticated, isAuthorized } from './helpers.js'
import { IdentityContext } from './identity-context.js'
import { createSystemIdentityContext, useSystemIdentityContext } from './system-identity-context.js'

describe('createSystemIdentityContext', () => {
  it('reports isAuthenticated as true', async () => {
    const ctx = createSystemIdentityContext()
    expect(await ctx.isAuthenticated()).toBe(true)
  })

  it('reports isAuthorized as true without roles', async () => {
    const ctx = createSystemIdentityContext()
    expect(await ctx.isAuthorized()).toBe(true)
  })

  it('reports isAuthorized as true for any roles', async () => {
    const ctx = createSystemIdentityContext()
    expect(await ctx.isAuthorized('admin', 'superuser')).toBe(true)
  })

  it('returns the default system user when username is omitted', async () => {
    const ctx = createSystemIdentityContext()
    expect(await ctx.getCurrentUser()).toEqual({ username: 'system', roles: [] })
  })

  it('honours a custom username', async () => {
    const ctx = createSystemIdentityContext({ username: 'migration-job' })
    expect(await ctx.getCurrentUser()).toEqual({ username: 'migration-job', roles: [] })
  })
})

describe('useSystemIdentityContext', () => {
  it('returns a child scope, not the parent injector', async () => {
    await usingAsync(createInjector(), async (parent) => {
      const child = useSystemIdentityContext({ injector: parent })
      expect(child).not.toBe(parent)
      await child[Symbol.asyncDispose]()
    })
  })

  it('binds an elevated identity on the child scope only', async () => {
    await usingAsync(createInjector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        expect(await isAuthenticated(child)).toBe(true)
        expect(await isAuthorized(child, 'admin')).toBe(true)
        expect(await isAuthenticated(parent)).toBe(false)
      })
    })
  })

  it('uses the default username when not specified', async () => {
    await usingAsync(createInjector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        const user = await getCurrentUser(child)
        expect(user.username).toBe('system')
      })
    })
  })

  it('propagates the configured username through getCurrentUser', async () => {
    await usingAsync(createInjector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent, username: 'seed-script' }), async (child) => {
        const user = await getCurrentUser(child)
        expect(user).toEqual({ username: 'seed-script', roles: [] })
      })
    })
  })

  it('disposes the child scope once usingAsync completes', async () => {
    await usingAsync(createInjector(), async (parent) => {
      let childRef: ReturnType<typeof useSystemIdentityContext> | undefined
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        childRef = child
      })
      expect(childRef).toBeDefined()
      expect(() => childRef!.get(IdentityContext)).toThrow(InjectorDisposedError)
    })
  })

  it('does not dispose the parent injector', async () => {
    await usingAsync(createInjector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async () => {
        // no-op
      })
      expect(() => parent.createScope()).not.toThrow()
    })
  })
})
