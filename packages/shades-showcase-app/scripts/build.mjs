import { build } from 'esbuild'
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'

build({
  plugins: [pnpPlugin()],
  entryPoints: ['./src/index.tsx'],
  jsxFactory: 'createComponent',
  jsxFragmentFactory: 'createFragment',
  outdir: 'bundle/js',
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: true,
  platform: 'browser',
  format: 'esm',
})
