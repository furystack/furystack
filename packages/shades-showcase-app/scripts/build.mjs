import { build } from 'esbuild'
import { getBundleBuildOptions } from './build-defaults.mjs'

build({
  ...getBundleBuildOptions(),
  minify: true,
  keepNames: true,
})
  .then((result) => {
    console.log('Build successful', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Build failed', error)
    process.exit(1)
  })
