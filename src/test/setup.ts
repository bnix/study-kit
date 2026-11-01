import '@testing-library/jest-dom/vitest'

// vitest's jsdom environment doesn't expose window.localStorage on the
// global, and Node's own experimental global `localStorage` accessor is a
// no-op without a --localstorage-file flag. Polyfill a minimal in-memory
// Storage so app code and tests can use the real `localStorage` global.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
})
