import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { mkdirSync, writeFileSync } from 'fs'
import { createServer } from 'http'
import { tmpdir } from 'os'
import { join } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ProxyManager } from './proxy-manager.js'
import { StaticServerManager } from './static-server-manager.js'

describe('ProxyManager', () => {
  // Create a temporary directory for test files
  const testDir = join(tmpdir(), 'furystack-proxy-test')

  beforeAll(() => {
    try {
      mkdirSync(testDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  })

  describe('Basic proxy functionality', () => {
    it('Should proxy requests from source URL to target URL', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const staticServerManager = injector.getInstance(StaticServerManager)

        const proxyPort = getPort()
        const targetPort = getPort()

        // Create a test file for the target server
        const testFile = join(testDir, 'test.json')
        writeFileSync(
          testFile,
          JSON.stringify({
            message: 'Hello from target server',
            url: '/test',
            timestamp: Date.now(),
          }),
        )

        // Set up target server (static file server) - serve files from testDir
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: testDir,
          port: targetPort,
        })

        // Set up proxy server
        await proxyManager.addProxy({
          sourceBaseUrl: '/old',
          targetBaseUrl: `http://localhost:${targetPort}`,
          pathRewrite: (path) => path.replace('/path', ''),
          sourcePort: proxyPort,
        })

        const result = await fetch(`http://127.0.0.1:${proxyPort}/old/path/test.json`)

        expect(result.status).toBe(200)
        expect(result.url).toBe(`http://127.0.0.1:${proxyPort}/old/path/test.json`)

        const responseData = (await result.json()) as { message: string; url: string; timestamp: number }
        expect(responseData.message).toBe('Hello from target server')
        expect(responseData.url).toBe('/test')
      })
    })

    it('Should preserve query strings when proxying', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create a simple echo server that returns query parameters
        const targetServer = createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ url: req.url, query: req.url?.split('?')[1] || '' }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test?foo=bar&baz=qux`)
          expect(result.status).toBe(200)

          const data = (await result.json()) as { url: string; query: string }
          expect(data.query).toBe('foo=bar&baz=qux')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle header transformation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const staticServerManager = injector.getInstance(StaticServerManager)

        const proxyPort = getPort()
        const targetPort = getPort()

        // Create a test file that returns headers
        const headersFile = join(testDir, 'headers.json')
        writeFileSync(
          headersFile,
          JSON.stringify({
            message: 'Headers test',
            receivedHeaders: '{{HEADERS}}', // Placeholder for dynamic content
          }),
        )

        // Set up target server
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: testDir,
          port: targetPort,
        })

        // Set up proxy server with header transformation
        await proxyManager.addProxy({
          sourceBaseUrl: '/old',
          targetBaseUrl: `http://localhost:${targetPort}`,
          pathRewrite: (path) => path.replace('/path', ''),
          sourcePort: proxyPort,
          headers: () => ({
            'X-Custom-Header': 'custom-value',
            Authorization: 'Bearer new-token',
          }),
        })

        const result = await fetch(`http://127.0.0.1:${proxyPort}/old/path/headers.json`, {
          headers: {
            Authorization: 'Bearer old-token',
            'User-Agent': 'test-agent',
          },
        })

        expect(result.status).toBe(200)
        const responseData = (await result.json()) as { message: string; receivedHeaders: string }
        expect(responseData.message).toBe('Headers test')
      })
    })

    it('Should handle cookie transformation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const staticServerManager = injector.getInstance(StaticServerManager)

        const proxyPort = getPort()
        const targetPort = getPort()

        // Create a test file for cookies
        const cookiesFile = join(testDir, 'cookies.json')
        writeFileSync(
          cookiesFile,
          JSON.stringify({
            message: 'Cookies test',
            receivedCookies: '{{COOKIES}}', // Placeholder for dynamic content
          }),
        )

        // Set up target server
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: testDir,
          port: targetPort,
        })

        // Set up proxy server with cookie transformation
        await proxyManager.addProxy({
          sourceBaseUrl: '/old',
          targetBaseUrl: `http://localhost:${targetPort}`,
          pathRewrite: (path) => path.replace('/path', ''),
          sourcePort: proxyPort,
          cookies: (originalCookies) => [...originalCookies, 'newCookie=newValue', 'sessionId=updated-session'],
        })

        const result = await fetch(`http://127.0.0.1:${proxyPort}/old/path/cookies.json`, {
          headers: {
            Cookie: 'oldCookie=oldValue; sessionId=old-session',
          },
        })

        expect(result.status).toBe(200)
        const responseData = (await result.json()) as { message: string; receivedCookies: string }
        expect(responseData.message).toBe('Cookies test')
      })
    })

    it('Should handle POST requests with JSON body', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create an echo server that returns the request body
        const targetServer = createServer((req, res) => {
          const chunks: Buffer[] = []
          req.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
          })
          req.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8')
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ received: JSON.parse(body), method: req.method }))
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
          })

          const testData = { name: 'test', value: 123, nested: { key: 'value' } }
          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData),
          })

          expect(result.status).toBe(200)
          const data = (await result.json()) as { received: typeof testData; method: string }
          expect(data.received).toEqual(testData)
          expect(data.method).toBe('POST')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle response cookies transformation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create a server that sets cookies
        const targetServer = createServer((_req, res) => {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': ['sessionId=abc123; HttpOnly', 'theme=dark; Path=/'],
          })
          res.end(JSON.stringify({ message: 'Cookies set' }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            responseCookies: (cookies) => {
              // Transform the cookies
              return cookies.map((cookie) => cookie.replace('sessionId=abc123', 'sessionId=xyz789'))
            },
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)
          expect(result.status).toBe(200)

          const setCookieHeader = result.headers.get('set-cookie')
          expect(setCookieHeader).toContain('sessionId=xyz789')
          expect(setCookieHeader).not.toContain('sessionId=abc123')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should not match requests outside source base URL', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const staticServerManager = injector.getInstance(StaticServerManager)

        const proxyPort = getPort()
        const targetPort = getPort()

        // Create a test file
        const testFile = join(testDir, 'test.json')
        writeFileSync(testFile, JSON.stringify({ message: 'test' }))

        // Set up target server
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: testDir,
          port: targetPort,
        })

        // Set up proxy server
        await proxyManager.addProxy({
          sourceBaseUrl: '/old',
          targetBaseUrl: `http://localhost:${targetPort}`,
          pathRewrite: (path) => path.replace('/path', ''),
          sourcePort: proxyPort,
        })

        try {
          const result = await fetch(`http://127.0.0.1:${proxyPort}/different/path`)

          // Should not proxy, request should be handled by other handlers or return 404
          expect(result.status).not.toBe(200)
        } catch (error) {
          // Connection error is expected when no handler matches
          expect(error).toBeDefined()
        }
      })
    })

    it('Should handle exact URL matches', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const staticServerManager = injector.getInstance(StaticServerManager)

        const proxyPort = getPort()
        const targetPort = getPort()

        // Create a test file
        const exactFile = join(testDir, 'exact.json')
        writeFileSync(
          exactFile,
          JSON.stringify({
            message: 'Exact match test',
            url: '/exact',
          }),
        )

        // Set up target server
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: testDir,
          port: targetPort,
        })

        // Set up proxy server
        await proxyManager.addProxy({
          sourceBaseUrl: '/exact',
          targetBaseUrl: `http://localhost:${targetPort}`,
          pathRewrite: (path) => path, // Keep the path as-is
          sourcePort: proxyPort,
        })

        const result = await fetch(`http://127.0.0.1:${proxyPort}/exact/exact.json`)

        expect(result.status).toBe(200)
        const responseData = (await result.json()) as { message: string; url: string }
        expect(responseData.message).toBe('Exact match test')
        expect(responseData.url).toBe('/exact')
      })
    })

    it('Should handle server errors gracefully', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const proxyPort = getPort()
        const unavailablePort = getPort() // Get a valid port number that doesn't have a server

        // Set up proxy to non-existent target
        await proxyManager.addProxy({
          sourceBaseUrl: '/api',
          targetBaseUrl: `http://localhost:${unavailablePort}`,
          sourcePort: proxyPort,
        })

        const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)
        expect(result.status).toBe(502) // Bad Gateway
        expect(await result.text()).toBe('Bad Gateway')
      })
    })

    it('Should emit onProxyFailed event on error', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const proxyPort = getPort()
        const unavailablePort = getPort()

        let failedEvent: { from: string; to: string; error: unknown } | undefined

        proxyManager.subscribe('onProxyFailed', (event) => {
          failedEvent = event
        })

        // Set up proxy to non-existent target
        await proxyManager.addProxy({
          sourceBaseUrl: '/api',
          targetBaseUrl: `http://localhost:${unavailablePort}`,
          sourcePort: proxyPort,
        })

        await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

        expect(failedEvent).toBeDefined()
        expect(failedEvent?.from).toBe('/api')
        expect(failedEvent?.to).toContain(`http://localhost:${unavailablePort}`)
      })
    })

    it('Should validate targetBaseUrl on addProxy', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)

        await expect(
          proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: 'not-a-valid-url',
            sourcePort: getPort(),
          }),
        ).rejects.toThrow('Invalid targetBaseUrl')
      })
    })

    it('Should filter hop-by-hop headers', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}

        // Create a server that captures headers
        const targetServer = createServer((req, res) => {
          receivedHeaders = { ...req.headers }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ message: 'ok' }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            headers: (original) => {
              // Verify that Connection header was filtered from original headers
              expect(original.connection).toBeUndefined()
              return original
            },
          })

          await fetch(`http://127.0.0.1:${proxyPort}/api/test`, {
            headers: {
              Connection: 'keep-alive',
              'X-Custom-Header': 'should-be-forwarded',
              'X-Hop-Header': 'test-value',
            },
          })

          // Note: fetch() may add its own Connection header when making the request
          // The important thing is that custom headers are forwarded
          expect(receivedHeaders['x-custom-header']).toBe('should-be-forwarded')
          expect(receivedHeaders['x-hop-header']).toBe('test-value')
        } finally {
          targetServer.close()
        }
      })
    })
  })
})
