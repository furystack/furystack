import { defineConfig } from 'vite'

// https://vitejs.dev/config/

const furyStackDeps = [
  '@furystack/shades-common-components',
  '@furystack/shades',
  '@furystack/inject',
  '@furystack/utils',
  '@furystack/core',
  '@furystack/repository',
  '@furystack/shades-nipple',
  '@furystack/shades-lottie',
]

export default defineConfig({
  optimizeDeps: {
    include: [...furyStackDeps],
    exclude: ['monaco-editor'],
  },
})
