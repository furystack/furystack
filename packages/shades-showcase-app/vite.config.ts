import { codecovVitePlugin } from '@codecov/vite-plugin'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/

export default defineConfig(async () => {
  return {
    plugins: [
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'shades-showcase-app',
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ],
    build: {
      rollupOptions: {
        external: ['vitest'],
      },
    },
  }
})
