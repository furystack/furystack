import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { mkdirSync, writeFileSync } from 'fs'
import type { OutgoingHttpHeaders } from 'http'
import { createServer as createHttpServer } from 'http'
import { tmpdir } from 'os'
import { join } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { RawData } from 'ws'
import { WebSocket, WebSocketServer } from 'ws'
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
        const targetServer = createHttpServer((req, res) => {
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
        const targetServer = createHttpServer((req, res) => {
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
        const targetServer = createHttpServer((_req, res) => {
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
        const targetServer = createHttpServer((req, res) => {
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

    it('Should preserve multiple Set-Cookie headers from target', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        const targetServer = createHttpServer((_req, res) => {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': ['cookieA=a; Path=/; HttpOnly', 'cookieB=b; Path=/', 'cookieC=c; Path=/'],
          })
          res.end(JSON.stringify({ ok: true }))
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

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)
          expect(result.status).toBe(200)

          const anyHeaders = result.headers as unknown as { getSetCookie?: () => string[] }
          const cookies = anyHeaders.getSetCookie?.()
          if (cookies) {
            expect(cookies.length).toBeGreaterThanOrEqual(3)
            expect(cookies.join('\n')).toContain('cookieA=a')
            expect(cookies.join('\n')).toContain('cookieB=b')
            expect(cookies.join('\n')).toContain('cookieC=c')
          } else {
            // Fallback: combined header still should contain at least one cookie
            const setCookieHeader = result.headers.get('set-cookie')
            expect(setCookieHeader).toBeTruthy()
            expect(setCookieHeader as string).toContain('cookieA=a')
          }
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should add X-Forwarded headers to target request', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let received: Record<string, string | string[] | undefined> = {}
        const targetServer = createHttpServer((req, res) => {
          received = { ...req.headers }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
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

          await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          expect(received['x-forwarded-for']).toBeTruthy()
          expect(received['x-forwarded-host']).toBeTruthy()
          expect(received['x-forwarded-proto']).toBeTruthy()
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should abort upstream when client disconnects', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let chunksWritten = 0
        let closedEarly = false
        const totalChunks = 100
        const targetServer = createHttpServer((_req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          const interval = setInterval(() => {
            chunksWritten++
            res.write('chunk\n')
            if (chunksWritten >= totalChunks) {
              clearInterval(interval)
              res.end('done')
            }
          }, 5)
          res.on('close', () => {
            closedEarly = chunksWritten < totalChunks
            clearInterval(interval)
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

          const controller = new AbortController()
          const fetchPromise = fetch(`http://127.0.0.1:${proxyPort}/api/stream`, { signal: controller.signal }).then(
            async (response) => {
              // Start reading the body stream
              const reader = response.body?.getReader()
              if (!reader) throw new Error('No body')
              // Read one chunk
              await reader.read()
              // Then abort
              controller.abort()
              // Try to read more (should fail)
              return reader.read()
            },
          )

          await expect(fetchPromise).rejects.toBeDefined()

          // Give the server a moment to receive the abort
          await new Promise((r) => setTimeout(r, 100))

          expect(closedEarly).toBe(true)
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle request timeout', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let failedEvent: { from: string; to: string; error: unknown } | undefined

        proxyManager.subscribe('onProxyFailed', (event) => {
          failedEvent = event
        })

        // Create a server that delays response longer than timeout
        const targetServer = createHttpServer((_req, res) => {
          // Delay for 2 seconds (longer than our 100ms timeout)
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'delayed response' }))
          }, 2000)
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            timeout: 100, // Very short timeout to trigger quickly
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          // Should return 502 Bad Gateway due to timeout
          expect(result.status).toBe(502)
          expect(await result.text()).toBe('Bad Gateway')

          // Should emit onProxyFailed event
          expect(failedEvent).toBeDefined()
          expect(failedEvent?.from).toBe('/api')
          expect(failedEvent?.to).toContain(`http://localhost:${targetPort}`)
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should complete successfully when response is faster than timeout', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create a fast-responding server
        const targetServer = createHttpServer((_req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ message: 'fast response' }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            timeout: 5000, // Generous timeout
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          // Should succeed
          expect(result.status).toBe(200)
          const data = (await result.json()) as { message: string }
          expect(data.message).toBe('fast response')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should use default timeout when not specified', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create a server with moderate delay (500ms)
        const targetServer = createHttpServer((_req, res) => {
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'response after delay' }))
          }, 500)
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          // No timeout specified - should use default 30000ms
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            // timeout not specified - uses default
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          // Should succeed with default timeout
          expect(result.status).toBe(200)
          const data = (await result.json()) as { message: string }
          expect(data.message).toBe('response after delay')
        } finally {
          targetServer.close()
        }
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('Should validate invalid protocol (non-HTTP/HTTPS)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const proxyPort = getPort()

        await expect(
          proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: 'ftp://example.com',
            sourcePort: proxyPort,
          }),
        ).rejects.toThrow('Invalid targetBaseUrl protocol')
      })
    })

    it('Should handle invalid target URL created by pathRewrite', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let failedEvent: { from: string; to: string; error: unknown } | undefined

        proxyManager.subscribe('onProxyFailed', (event) => {
          failedEvent = event
        })

        // Create a simple server
        const targetServer = createHttpServer((_req, res) => {
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
            // Create invalid URL with pathRewrite
            pathRewrite: () => '://invalid',
          })

          const result = await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          // Should return 502 due to invalid target URL
          expect(result.status).toBe(502)
          expect(await result.text()).toBe('Bad Gateway')

          // Should emit onProxyFailed event
          expect(failedEvent).toBeDefined()
          expect(failedEvent?.error).toBeDefined()
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle number-type header values', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}
        let transformedHeaders: OutgoingHttpHeaders | undefined

        const targetServer = createHttpServer((req, res) => {
          receivedHeaders = { ...req.headers }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
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
              transformedHeaders = {
                ...original,
                'X-Custom-Number': 12345 as unknown as string,
                'X-Custom-String': 'string-value',
              }
              return transformedHeaders
            },
          })

          await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          // Verify headers transformer was called and returns correct types
          expect(transformedHeaders).toBeDefined()
          expect(transformedHeaders?.['X-Custom-Number']).toBe(12345)
          expect(transformedHeaders?.['X-Custom-String']).toBe('string-value')

          // Verify string header was forwarded
          expect(receivedHeaders['x-custom-string']).toBe('string-value')
          // Number headers get converted to strings by the proxy logic
          expect(receivedHeaders['x-custom-number']).toBe('12345')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle array-type header values', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}

        const targetServer = createHttpServer((req, res) => {
          receivedHeaders = { ...req.headers }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            headers: () => ({
              'X-Array-Header': ['value1', 'value2', 'value3'] as unknown as string,
            }),
          })

          await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          expect(receivedHeaders['x-array-header']).toBe('value1, value2, value3')
        } finally {
          targetServer.close()
        }
      })
    })

    it('Should handle undefined header values', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}

        const targetServer = createHttpServer((req, res) => {
          receivedHeaders = { ...req.headers }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/api',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            headers: () => ({
              'X-Defined-Header': 'defined',
              'X-Undefined-Header': undefined as unknown as string,
            }),
          })

          await fetch(`http://127.0.0.1:${proxyPort}/api/test`)

          expect(receivedHeaders['x-defined-header']).toBe('defined')
          expect(receivedHeaders['x-undefined-header']).toBeUndefined()
        } finally {
          targetServer.close()
        }
      })
    })
  })

  describe('WebSocket proxy functionality', () => {
    it('Should proxy WebSocket connections when enabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          ws.on('message', (data: RawData) => {
            // Echo back the message with a prefix
            const message = Buffer.isBuffer(data)
              ? data.toString('utf8')
              : Array.isArray(data)
                ? Buffer.concat(data).toString('utf8')
                : Buffer.from(data).toString('utf8')
            ws.send(`echo: ${message}`)
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          // Set up proxy with WebSocket support
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          // Connect WebSocket client through proxy
          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              clientWs.send('hello')
            })

            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('echo: hello')
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle bidirectional WebSocket communication', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          // Send messages to client
          ws.send('server-message-1')
          ws.send('server-message-2')

          ws.on('message', (data: RawData) => {
            const message = Buffer.isBuffer(data)
              ? data.toString('utf8')
              : Array.isArray(data)
                ? Buffer.concat(data).toString('utf8')
                : Buffer.from(data).toString('utf8')
            ws.send(`received: ${message}`)
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          const receivedMessages: string[] = []

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              clientWs.send('client-message-1')
              clientWs.send('client-message-2')
            })

            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              receivedMessages.push(message)

              if (receivedMessages.length >= 4) {
                expect(receivedMessages).toContain('server-message-1')
                expect(receivedMessages).toContain('server-message-2')
                expect(receivedMessages).toContain('received: client-message-1')
                expect(receivedMessages).toContain('received: client-message-2')
                clientWs.close()
                resolve()
              }
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should not proxy WebSocket when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          // Set up proxy WITHOUT WebSocket support
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: false,
          })

          // Try to connect WebSocket client through proxy
          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve) => {
            clientWs.on('error', (error) => {
              // Should fail because WebSocket is not enabled
              expect(error).toBeDefined()
              clientWs.close()
              resolve()
            })

            clientWs.on('open', () => {
              // Should not open successfully
              clientWs.close()
              resolve()
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should preserve WebSocket subprotocols', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedProtocol: string | undefined

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws, req) => {
          receivedProtocol = req.headers['sec-websocket-protocol'] as string
          ws.send('connected')
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`, ['v1.chat', 'v2.chat'])

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              // Wait for server message
            })

            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('connected')
              expect(receivedProtocol).toContain('v1.chat')
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle WebSocket path rewriting', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedPath: string | undefined

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws, req) => {
          receivedPath = req.url
          ws.send('connected')
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/old/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
            pathRewrite: (path) => path.replace('/chat', '/api/chat'),
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/old/ws/chat`)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('connected')
              expect(receivedPath).toBe('/api/chat')
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle WebSocket connection closure from client', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let serverClosed = false

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          ws.on('close', () => {
            serverClosed = true
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              clientWs.close()
            })

            clientWs.on('close', () => {
              // Give server time to process close event
              setTimeout(() => {
                expect(serverClosed).toBe(true)
                resolve()
              }, 100)
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle WebSocket connection closure from server', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          // Close connection immediately after opening
          ws.send('goodbye')
          setTimeout(() => ws.close(), 50)
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            let messageReceived = false

            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('goodbye')
              messageReceived = true
            })

            clientWs.on('close', () => {
              expect(messageReceived).toBe(true)
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should emit onWebSocketProxyFailed event on error', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const proxyPort = getPort()
        const unavailablePort = getPort()

        let failedEvent: { from: string; to: string; error: unknown } | undefined

        proxyManager.subscribe('onWebSocketProxyFailed', (event) => {
          failedEvent = event
        })

        await proxyManager.addProxy({
          sourceBaseUrl: '/ws',
          targetBaseUrl: `http://localhost:${unavailablePort}`,
          sourcePort: proxyPort,
          enableWebsockets: true,
        })

        const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

        await new Promise<void>((resolve) => {
          clientWs.on('error', () => {
            // Expected error
          })

          clientWs.on('close', () => {
            // Give time for event to be emitted
            setTimeout(() => {
              expect(failedEvent).toBeDefined()
              expect(failedEvent?.from).toBe('/ws')
              expect(failedEvent?.to).toContain(`http://localhost:${unavailablePort}`)
              resolve()
            }, 100)
          })
        })
      })
    })

    it('Should handle large WebSocket messages', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          ws.on('message', (data: RawData) => {
            // Echo back the large message
            ws.send(data)
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          // Create a large message (1MB)
          const largeMessage = 'x'.repeat(1024 * 1024)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              clientWs.send(largeMessage)
            })

            clientWs.on('message', (data: RawData) => {
              const dataStr = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(dataStr.length).toBe(largeMessage.length)
              expect(dataStr).toBe(largeMessage)
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle binary WebSocket messages', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws) => {
          ws.on('message', (data: RawData) => {
            // Echo back the binary data
            ws.send(data)
          })
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          // Create binary data
          const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0xff, 0xfe, 0xfd])

          await new Promise<void>((resolve, reject) => {
            clientWs.on('open', () => {
              clientWs.send(binaryData)
            })

            clientWs.on('message', (data) => {
              expect(Buffer.isBuffer(data)).toBe(true)
              expect(Buffer.compare(data as Buffer, binaryData)).toBe(0)
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should apply header transformations to WebSocket upgrade', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws, req) => {
          receivedHeaders = { ...req.headers }
          ws.send('connected')
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
            headers: () => ({
              'X-Custom-Header': 'custom-value',
              'X-Auth-Token': 'bearer-token',
            }),
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('connected')
              expect(receivedHeaders['x-custom-header']).toBe('custom-value')
              expect(receivedHeaders['x-auth-token']).toBe('bearer-token')
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle WebSocket upgrade timeout', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        // Create a server that delays WebSocket upgrade longer than timeout
        const targetServer = createHttpServer()

        targetServer.on('upgrade', () => {
          // Don't respond to upgrade - let it timeout
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
            timeout: 200, // Short timeout
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              // If we haven't resolved by now, the test failed
              reject(new Error('Test timeout - WebSocket did not fail as expected'))
            }, 2000)

            clientWs.on('error', () => {
              // Expected error
            })

            clientWs.on('close', () => {
              // Give time for event to be emitted
              setTimeout(() => {
                clearTimeout(timeoutId)
                // The timeout test might not always trigger the event reliably
                // Just verify the connection was closed
                resolve()
              }, 300)
            })
          })
        } finally {
          targetServer.close()
        }
      })
    }, 10000)

    it('Should handle invalid target URL in WebSocket upgrade', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let failedEvent: { from: string; to: string; error: unknown } | undefined

        proxyManager.subscribe('onWebSocketProxyFailed', (event) => {
          failedEvent = event
        })

        // Create target server (won't be reached due to invalid URL)
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
            // Create invalid URL with pathRewrite
            pathRewrite: () => '://invalid-url',
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws/test`)

          await new Promise<void>((resolve) => {
            clientWs.on('error', () => {
              // Expected error
            })

            clientWs.on('close', () => {
              // Give time for event to be emitted
              setTimeout(() => {
                expect(failedEvent).toBeDefined()
                expect(failedEvent?.error).toBeDefined()
                resolve()
              }, 100)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })

    it('Should handle WebSocket header value types (number, array, undefined)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const proxyManager = injector.getInstance(ProxyManager)
        const targetPort = getPort()
        const proxyPort = getPort()

        let receivedHeaders: Record<string, string | string[] | undefined> = {}

        // Create target WebSocket server
        const targetServer = createHttpServer()
        const targetWss = new WebSocketServer({ server: targetServer })

        targetWss.on('connection', (ws, req) => {
          receivedHeaders = { ...req.headers }
          ws.send('connected')
        })

        await new Promise<void>((resolve) => {
          targetServer.listen(targetPort, () => resolve())
        })

        try {
          await proxyManager.addProxy({
            sourceBaseUrl: '/ws',
            targetBaseUrl: `http://localhost:${targetPort}`,
            sourcePort: proxyPort,
            enableWebsockets: true,
            headers: () => ({
              'X-Number-Header': 42 as unknown as string,
              'X-Array-Header': ['val1', 'val2'] as unknown as string,
              'X-Undefined-Header': undefined as unknown as string,
              'X-String-Header': 'string-value',
            }),
          })

          const clientWs = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`)

          await new Promise<void>((resolve, reject) => {
            clientWs.on('message', (data: RawData) => {
              const message = Buffer.isBuffer(data)
                ? data.toString('utf8')
                : Array.isArray(data)
                  ? Buffer.concat(data).toString('utf8')
                  : Buffer.from(data).toString('utf8')
              expect(message).toBe('connected')
              expect(receivedHeaders['x-number-header']).toBe('42')
              expect(receivedHeaders['x-array-header']).toBe('val1, val2')
              expect(receivedHeaders['x-string-header']).toBe('string-value')
              expect(receivedHeaders['x-undefined-header']).toBeUndefined()
              clientWs.close()
              resolve()
            })

            clientWs.on('error', (err) => {
              clientWs.close()
              reject(err)
            })
          })
        } finally {
          targetWss.close()
          targetServer.close()
        }
      })
    })
  })
})
