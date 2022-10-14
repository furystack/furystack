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
  jsxFragment: 'createFragment',
  outdir: 'bundle/js',
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: true,
  platform: 'browser',
  format: 'esm',
  loader: {
    '.ttf': 'dataurl',
    '.css': 'css',
  },
  external: ['data:image', 'vitest'],
})

/**
 * Returns the default Monaco build options
 *
 * @returns {import('esbuild').BuildOptions} The generated Build options
 */
export const getMonacoBuildOptions = () => ({
  ...getBundleBuildOptions(),
  outbase: 'monaco-editor/esm/vs',
  outdir: 'bundle/js/monaco-editor',
  entryPoints: workerEntryPoints.map((entry) => `monaco-editor/esm/vs/${entry}`),
})
