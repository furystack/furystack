import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'

const workerEntryPoints = [
  'language/json/json.worker.js',
  'language/css/css.worker.js',
  'language/html/html.worker.js',
  'language/typescript/ts.worker.js',
  'editor/editor.worker.js',
]

export const getBundleBuildOptions = () => ({
  plugins: [pnpPlugin()],
  entryPoints: ['./src/index.tsx'],
  jsxFactory: 'createComponent',
  outdir: 'bundle/js',
  bundle: true,
  minify: false,
  sourcemap: true,
  splitting: true,
  platform: 'browser',
  format: 'esm',
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.eot': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
    '.css': 'css',
  },
})

/**
 * Returns the default Monaco build options
 *
 * @returns {import('esbuild').BuildOptions}
 */
export const getMonacoBuildOptions = () => ({
  ...getBundleBuildOptions(),
  entryPoints: workerEntryPoints.map((entry) => `monaco-editor/esm/vs/${entry}`),
  splitting: false,
  format: 'iife',
})
