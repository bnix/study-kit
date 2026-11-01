import { describe, expect, it } from 'vitest'
import { formatInterval } from './formatInterval'

describe('formatInterval', () => {
  const NOW = new Date('2026-10-30T12:00:00')
  const after = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000)

  it('formats across units', () => {
    expect(formatInterval(NOW, after(0.2))).toBe('<1m')
    expect(formatInterval(NOW, after(10))).toBe('10m')
    expect(formatInterval(NOW, after(180))).toBe('3h')
    expect(formatInterval(NOW, after(4 * 1440))).toBe('4d')
    expect(formatInterval(NOW, after(60 * 1440))).toBe('2mo')
    expect(formatInterval(NOW, after(800 * 1440))).toBe('2y')
  })
})
