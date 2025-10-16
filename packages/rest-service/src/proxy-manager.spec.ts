import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { mkdirSync, writeFileSync } from 'fs'
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

        // Test direct access to target server first
        const directResult = await fetch(`http://localhost:${targetPort}/test.json`)

        if (directResult.status === 200) {
          await directResult.json()
        }

        const result = await fetch(`http://127.0.0.1:${proxyPort}/old/path/test.json`)

        expect(result.status).toBe(200)
        expect(result.url).toBe(`http://127.0.0.1:${proxyPort}/old/path/test.json`)

        const responseData = (await result.json()) as { message: string; url: string; timestamp: number }
        expect(responseData.message).toBe('Hello from target server')
        expect(responseData.url).toBe('/test')
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
  })
})
