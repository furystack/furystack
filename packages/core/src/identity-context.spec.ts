import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { getCurrentUser, isAuthenticated, isAuthorized } from './helpers.js'
import type { IdentityContext as IdentityContextType } from './identity-context.js'
import { IdentityContext } from './identity-context.js'

describe('IdentityContext default implementation', () => {
  it('reports isAuthenticated as false', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(await i.get(IdentityContext).isAuthenticated()).toBe(false)
    })
  })

  it('reports isAuthorized as false', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(await i.get(IdentityContext).isAuthorized('admin')).toBe(false)
    })
  })

  it('rejects getCurrentUser because no identity is bound', async () => {
    await usingAsync(createInjector(), async (i) => {
      await expect(i.get(IdentityContext).getCurrentUser()).rejects.toThrowError('No IdentityContext')
    })
  })

  it('returns the bound context after rebinding on an injector', async () => {
    const custom: IdentityContextType = {
      isAuthenticated: () => Promise.resolve(true),
      isAuthorized: () => Promise.resolve(true),
      getCurrentUser: () => Promise.resolve({ username: 'alice', roles: [] } as never),
    }
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => custom)
      expect(i.get(IdentityContext)).toBe(custom)
    })
  })

  it('keeps scoped bindings isolated to the scope they were declared on', async () => {
    const custom: IdentityContextType = {
      isAuthenticated: () => Promise.resolve(true),
      isAuthorized: () => Promise.resolve(true),
      getCurrentUser: () => Promise.resolve({ username: 'root', roles: [] } as never),
    }
    await usingAsync(createInjector(), async (root) => {
      root.bind(IdentityContext, () => custom)
      expect(root.get(IdentityContext)).toBe(custom)
      // `IdentityContext` is a scoped token -- each scope resolves its own
      // instance. A binding installed on the parent is *not* inherited by
      // child scopes; consumers that want the elevated context for a whole
      // subtree should use `useSystemIdentityContext` (which creates the
      // scope and binds on it) or bind explicitly on the resolving scope.
      await usingAsync(root.createScope(), async (child) => {
        expect(child.get(IdentityContext)).not.toBe(custom)
        expect(await child.get(IdentityContext).isAuthenticated()).toBe(false)
      })
    })
  })

  it('resolves a child-specific context without affecting the parent', async () => {
    await usingAsync(createInjector(), async (root) => {
      await usingAsync(root.createScope(), async (child) => {
        const childCtx: IdentityContextType = {
          isAuthenticated: () => Promise.resolve(true),
          isAuthorized: () => Promise.resolve(true),
          getCurrentUser: () => Promise.resolve({ username: 'child', roles: [] } as never),
        }
        child.bind(IdentityContext, () => childCtx)
        expect(await isAuthenticated(child)).toBe(true)
        expect(await isAuthenticated(root)).toBe(false)
      })
    })
  })

  it('is invoked by the isAuthenticated helper', async () => {
    await usingAsync(createInjector(), async (i) => {
      const ctx = i.get(IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthenticated')
      expect(await isAuthenticated(i)).toBe(false)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  it('is invoked by the isAuthorized helper', async () => {
    await usingAsync(createInjector(), async (i) => {
      const ctx = i.get(IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthorized')
      expect(await isAuthorized(i, 'admin')).toBe(false)
      expect(spy).toHaveBeenCalledWith('admin')
    })
  })

  it('is invoked by the getCurrentUser helper', async () => {
    await usingAsync(createInjector(), async (i) => {
      const ctx = i.get(IdentityContext)
      const spy = vi.spyOn(ctx, 'getCurrentUser')
      await expect(getCurrentUser(i)).rejects.toThrowError('No IdentityContext')
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
