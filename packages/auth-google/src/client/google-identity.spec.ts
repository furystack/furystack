import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockAccountsId = {
  initialize: vi.fn(),
  renderButton: vi.fn(),
  prompt: vi.fn(),
  disableAutoSelect: vi.fn(),
  revoke: vi.fn(),
}

describe('loadGoogleIdentityServices', () => {
  it('Should reject in non-browser environments', async () => {
    const originalDocument = globalThis.document
    try {
      Object.defineProperty(globalThis, 'document', { value: undefined, writable: true, configurable: true })

      vi.resetModules()
      const mod = await import('./google-identity.js')

      await expect(mod.loadGoogleIdentityServices()).rejects.toThrow(
        'loadGoogleIdentityServices requires a browser environment.',
      )
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    }
  })

  it('Should load the GIS script and resolve on success', async () => {
    const originalDocument = globalThis.document
    try {
      let capturedScript: { onload?: (() => void) | null; onerror?: (() => void) | null; src?: string } = {}
      const mockHead = {
        appendChild: vi.fn((el: typeof capturedScript) => {
          capturedScript = el
          queueMicrotask(() => el.onload?.())
          return el
        }),
      }
      Object.defineProperty(globalThis, 'document', {
        value: { createElement: () => ({ async: false, defer: false, onload: null, onerror: null }), head: mockHead },
        writable: true,
        configurable: true,
      })

      vi.resetModules()
      const mod = await import('./google-identity.js')

      await mod.loadGoogleIdentityServices()

      expect(mockHead.appendChild).toHaveBeenCalledOnce()
      expect(capturedScript.src).toBe('https://accounts.google.com/gsi/client')
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    }
  })

  it('Should reject and reset state when script fails to load', async () => {
    const originalDocument = globalThis.document
    try {
      const mockHead = {
        appendChild: vi.fn((el: { onload?: (() => void) | null; onerror?: (() => void) | null; src?: string }) => {
          queueMicrotask(() => el.onerror?.())
          return el
        }),
      }
      Object.defineProperty(globalThis, 'document', {
        value: { createElement: () => ({ async: false, defer: false, onload: null, onerror: null }), head: mockHead },
        writable: true,
        configurable: true,
      })

      vi.resetModules()
      const mod = await import('./google-identity.js')

      await expect(mod.loadGoogleIdentityServices()).rejects.toThrow('Failed to load Google Identity Services script.')
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    }
  })

  it('Should return the same promise on subsequent calls', async () => {
    const originalDocument = globalThis.document
    try {
      const mockHead = {
        appendChild: vi.fn((el: { onload?: (() => void) | null; onerror?: (() => void) | null }) => {
          queueMicrotask(() => el.onload?.())
          return el
        }),
      }
      Object.defineProperty(globalThis, 'document', {
        value: { createElement: () => ({ async: false, defer: false, onload: null, onerror: null }), head: mockHead },
        writable: true,
        configurable: true,
      })

      vi.resetModules()
      const mod = await import('./google-identity.js')

      const p1 = mod.loadGoogleIdentityServices()
      const p2 = mod.loadGoogleIdentityServices()
      expect(p1).toBe(p2)
      await p1
      expect(mockHead.appendChild).toHaveBeenCalledOnce()
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    }
  })
})

describe('initializeGoogleAuth', () => {
  let originalDocument: typeof globalThis.document

  beforeEach(() => {
    vi.restoreAllMocks()
    originalDocument = globalThis.document
    ;(globalThis as Record<string, unknown>).google = { accounts: { id: mockAccountsId } }

    const mockScript = {
      set src(_: string) {},
      async: false,
      defer: false,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }
    const mockHead = {
      appendChild: vi.fn((el: typeof mockScript) => {
        queueMicrotask(() => el.onload?.())
        return el
      }),
    }
    Object.defineProperty(globalThis, 'document', {
      value: { createElement: () => mockScript, head: mockHead },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).google
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true,
    })
  })

  it('Should call google.accounts.id.initialize with options', async () => {
    vi.resetModules()
    const mod = await import('./google-identity.js')

    const callback = vi.fn()
    const options = { client_id: 'test-client-id', callback }

    const controls = await mod.initializeGoogleAuth(options)

    expect(mockAccountsId.initialize).toHaveBeenCalledWith(options)
    expect(controls).toHaveProperty('renderButton')
    expect(controls).toHaveProperty('prompt')
    expect(controls).toHaveProperty('disableAutoSelect')
  })

  it('renderButton should delegate to google.accounts.id.renderButton', async () => {
    vi.resetModules()
    const mod = await import('./google-identity.js')

    const controls = await mod.initializeGoogleAuth({ client_id: 'id', callback: vi.fn() })
    const element = {} as HTMLElement

    controls.renderButton(element, { type: 'standard', size: 'large' })

    expect(mockAccountsId.renderButton).toHaveBeenCalledWith(element, { type: 'standard', size: 'large' })
  })

  it('prompt should delegate to google.accounts.id.prompt', async () => {
    vi.resetModules()
    const mod = await import('./google-identity.js')

    const controls = await mod.initializeGoogleAuth({ client_id: 'id', callback: vi.fn() })
    controls.prompt()

    expect(mockAccountsId.prompt).toHaveBeenCalled()
  })

  it('disableAutoSelect should delegate to google.accounts.id.disableAutoSelect', async () => {
    vi.resetModules()
    const mod = await import('./google-identity.js')

    const controls = await mod.initializeGoogleAuth({ client_id: 'id', callback: vi.fn() })
    controls.disableAutoSelect()

    expect(mockAccountsId.disableAutoSelect).toHaveBeenCalled()
  })
})
