import { build, serve } from 'esbuild'
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'

serve(
  {
    servedir: 'bundle',
    port: 8080,
  },
  {
    plugins: [pnpPlugin()],
    entryPoints: ['./src/index.tsx'],
    jsxFactory: 'createComponent',
    outdir: 'bundle/js',
    bundle: true,
    minify: true,
    sourcemap: true,
    splitting: true,
    platform: 'browser',
    format: 'esm',
  },
)
