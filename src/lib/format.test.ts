import { describe, expect, it } from 'vitest'

import {
  formatNumber,
  formatNumberWithUnit,
  formatPositionList,
  resolveText,
} from './format'

describe('format helpers', () => {
  it('resolves localized text by locale', () => {
    expect(resolveText({ ja: '波', en: 'wave' }, 'ja')).toBe('波')
    expect(resolveText({ ja: '波', en: 'wave' }, 'en')).toBe('wave')
  })

  it('formats numbers with locale-aware separators', () => {
    expect(formatNumber(1234.567, 'en', 1)).toBe('1,234.6')
    expect(formatNumber(1234.567, 'ja', 1)).toBe('1,234.6')
  })

  it('formats values with units', () => {
    expect(formatNumberWithUnit(12.34, 'ja', 'm', 1)).toBe('12.3 m')
  })

  it('formats position lists and handles empty lists', () => {
    expect(formatPositionList([], 'ja')).toBe('—')
    expect(formatPositionList([0, 0.5], 'en')).toBe('0 m, 0.5 m')
  })
})
