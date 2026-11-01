import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Quiz content is symlinked from `content/` to a curated folder inside the
// user's Obsidian vault (see README). Vite's dev server resolves symlinks to
// their real path and checks that real path against server.fs.allow, so the
// vault folder must be explicitly allowed or reading through the symlink
// 404s/403s even though `content` itself is inside the project root.
const VAULT_CONTENT_PATH = '/var/home/bryan/Documents/ObsidianVault/QuizMeDecks'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['.', VAULT_CONTENT_PATH],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
