import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { getCurrentUser, isAuthenticated, isAuthorized } from './helpers.js'
import { IdentityContext } from './identity-context.js'
import { SystemIdentityContext, useSystemIdentityContext } from './system-identity-context.js'

describe('SystemIdentityContext', () => {
  it('isAuthenticated should return true', async () => {
    const ctx = new SystemIdentityContext()
    expect(await ctx.isAuthenticated()).toBe(true)
  })

  it('isAuthorized should return true without roles', async () => {
    const ctx = new SystemIdentityContext()
    expect(await ctx.isAuthorized()).toBe(true)
  })

  it('isAuthorized should return true with roles', async () => {
    const ctx = new SystemIdentityContext()
    expect(await ctx.isAuthorized('admin', 'superuser')).toBe(true)
  })

  it('getCurrentUser should return default system user', async () => {
    const ctx = new SystemIdentityContext()
    const user = await ctx.getCurrentUser()
    expect(user).toEqual({ username: 'system', roles: [] })
  })

  it('getCurrentUser should respect custom username', async () => {
    const ctx = new SystemIdentityContext({ username: 'migration-job' })
    const user = await ctx.getCurrentUser()
    expect(user).toEqual({ username: 'migration-job', roles: [] })
  })
})

describe('useSystemIdentityContext', () => {
  it('should return a child injector, not the parent', async () => {
    await usingAsync(new Injector(), async (parent) => {
      const child = useSystemIdentityContext({ injector: parent })
      expect(child).not.toBe(parent)
      await child[Symbol.asyncDispose]()
    })
  })

  it('should resolve IdentityContext to a SystemIdentityContext', async () => {
    await usingAsync(new Injector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        const ctx = child.getInstance(IdentityContext)
        expect(ctx).toBeInstanceOf(SystemIdentityContext)
      })
    })
  })

  it('should be authenticated and authorized via helpers', async () => {
    await usingAsync(new Injector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        expect(await isAuthenticated(child)).toBe(true)
        expect(await isAuthorized(child, 'admin')).toBe(true)
      })
    })
  })

  it('should return the configured username via getCurrentUser', async () => {
    await usingAsync(new Injector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent, username: 'seed-script' }), async (child) => {
        const user = await getCurrentUser(child)
        expect(user).toEqual({ username: 'seed-script', roles: [] })
      })
    })
  })

  it('should use default username when not specified', async () => {
    await usingAsync(new Injector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        const user = await getCurrentUser(child)
        expect(user.username).toBe('system')
      })
    })
  })

  it('should dispose the child injector after usingAsync completes', async () => {
    await usingAsync(new Injector(), async (parent) => {
      let childRef: Injector | undefined
      await usingAsync(useSystemIdentityContext({ injector: parent }), async (child) => {
        childRef = child
      })
      expect(childRef).toBeDefined()
      expect(() => childRef!.getInstance(IdentityContext)).toThrow('Injector already disposed')
    })
  })

  it('should not dispose the parent injector', async () => {
    await usingAsync(new Injector(), async (parent) => {
      await usingAsync(useSystemIdentityContext({ injector: parent }), async () => {
        // no-op
      })
      expect(() => parent.getInstance(IdentityContext)).not.toThrow()
    })
  })
})
