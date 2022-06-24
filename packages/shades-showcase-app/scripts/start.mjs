import { serve } from 'esbuild'
import { createServer, request } from 'http'
import { getBundleBuildOptions } from './build-defaults.mjs'

const serveBundle = serve(
  {
    servedir: 'bundle',
    port: 8079,
  },
  {
    ...getBundleBuildOptions(),
  },
)

Promise.all([serveBundle]).then(([bundleResult]) => {
  // The result tells us where esbuild's local server is
  const { host, port } = bundleResult

  // Then start a proxy server on port 3000
  const proxy = createServer((req, res) => {
    // forwardRequest forwards an http request through to esbuid.
    const forwardRequest = (path) => {
      const options = {
        hostname: host,
        port,
        path,
        method: req.method,
        headers: req.headers,
      }

      const proxyReq = request(options, (proxyRes) => {
        if (proxyRes.statusCode === 404) {
          // If esbuild 404s the request, assume it's a route needing to
          // be handled by the JS bundle, so forward a second attempt to `/`.
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
  proxy.listen(8080)
})
