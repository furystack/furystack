import { build } from 'esbuild'
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'

build({
  plugins: [pnpPlugin()],
  entryPoints: ['./src/index.tsx'],
  jsxFactory: 'createComponent',
  outdir: 'bundle/js',
  bundle: true,
  minify: true,
  logLevel: 'debug',
  sourcemap: true,
  splitting: true,
  platform: 'browser',
  format: 'esm',
})
  .then((result) => {
    console.log('Build successful', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Build failed', error)
    process.exit(1)
  })
