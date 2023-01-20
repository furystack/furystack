import { context } from 'esbuild'
import { createServer, request } from 'http'
import { getBundleBuildOptions, getMonacoBuildOptions } from './build-defaults.mjs'
import { FgBlue, FgGreen, FgRed, FgYellow, Reset } from '@furystack/logging'

const proxyPort = process.env.PORT || 8080
const proxyHost = 'localhost'

const onRequest = (arg) => {
  const statusColor = arg.status > 499 ? FgRed : arg.status > 399 ? FgYellow : FgGreen
  console.log(`➡️  ${statusColor}<${arg.status}>${Reset} ${arg.path}`)
}

const serveWeb = async () => {
  try {
    const ctx = await context(getBundleBuildOptions())
    console.log(`✅ ${FgGreen}Bundle has been built.${Reset}`)
    const watcher = await ctx.watch()
    console.log(`✅ ${FgGreen}Bundle Watcher enabled.${Reset}`)
    const serve = await ctx.serve({
      servedir: 'bundle',
      port: 8079,
      onRequest,
    })
    console.log(`✅ ${FgGreen}Bundle Server started.${Reset}`)
    return { ctx, serve, watcher }
  } catch (error) {
    console.log(`❌ ${FgRed}Bundle build failed.${Reset}`)
    console.log(error)
    process.exit(1)
  }
}

const serveMonaco = async () => {
  try {
    const ctx = await context(getMonacoBuildOptions())
    console.log(`✅ ${FgGreen}Monaco has been built.${Reset}`)
    const watcher = await ctx.watch()
    console.log(`✅ ${FgGreen}Monaco Watcher enabled.${Reset}`)
    const serve = await ctx.serve({
      servedir: 'bundle',
      port: 8078,
      onRequest,
    })
    console.log(`✅ ${FgGreen}Monaco Server started.${Reset}`)
    return { ctx, serve, watcher }
  } catch (error) {
    console.log(`❌ ${FgRed}Monaco build failed.${Reset}`)
    console.log(error)
    process.exit(1)
  }
}

const isMonacoPath = (path) => path.startsWith('/js/monaco-editor/esm/vs')

console.log(`🧱 Starting app...`)

Promise.all([serveWeb(), serveMonaco()]).then(([bundleResult, monacoResult]) => {
  // The result tells us where esbuild's local server is
  const { host, port } = bundleResult.serve
  const { host: monacoHost, port: monacoPort } = monacoResult.serve

  const proxy = createServer((req, res) => {
    // forwardRequest forwards an http request through to esbuid.
    const forwardRequest = (path, redirectHost = host, redirectPort = port) => {
      /**
       * @type {import('http').RequestOptions} The options to use when making the request.
       */
      const options = {
        hostname: redirectHost,
        port: redirectPort,
        path,
        host: `${host}:${port}`,
        method: req.method,
        headers: req.headers,
      }

      const proxyReq = request(options, (proxyRes) => {
        if (isMonacoPath(path)) {
          if (proxyRes.client.remotePort === 8079) {
            return forwardRequest(proxyReq.path, monacoHost, monacoPort)
          }
        }

        if (proxyRes.statusCode === 404) {
          return forwardRequest('/')
        }

        // Otherwise esbuild handled it like a champ, so proxy the response back.
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      })

      req.pipe(proxyReq, { end: true })
    }

    // When we're called pass the request right through to esbuild.
    forwardRequest(req.url)
  })

  // Start our proxy server at the specified `listen` port.
  proxy.listen(proxyPort, proxyHost)
  console.log(`🏁 Proxy server running at ${FgBlue}http://${proxyHost}:${proxyPort}/${Reset}`)
})
