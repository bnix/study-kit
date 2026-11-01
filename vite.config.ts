import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // content/ may be a symlink into a notes vault outside the project. Keeping
  // symlinked paths as-is (instead of resolving them to their real location)
  // keeps them inside the project root, so Vite and Vitest are allowed to read
  // them without hardcoding the vault's absolute path.
  resolve: { preserveSymlinks: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
