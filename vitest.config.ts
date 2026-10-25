import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so tests run without the PWA plugin.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
