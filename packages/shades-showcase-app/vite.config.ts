import { defineConfig } from 'vite'

// https://vitejs.dev/config/

const furyStackDeps = [
  '@furystack/utils',
  '@furystack/inject',
  '@furystack/core',
  '@furystack/shades',
  '@furystack/shades-common-components',
  '@furystack/repository',
  '@furystack/shades-nipple',
  '@furystack/shades-lottie',
]

export default defineConfig(async () => {
  return {
    optimizeDeps: {
      include: [...furyStackDeps],
    },
  }
})
