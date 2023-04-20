import { defineConfig } from 'vite'

// https://vitejs.dev/config/

export default defineConfig(async () => {
  return {
    build: {
      rollupOptions: {
        external: ['vitest'],
      },
    },
  }
})
