import type { Locale, LocalizedText } from '../types'

/**
 * Resolves a bilingual text record to the currently selected locale.
 */
export const resolveText = (text: LocalizedText, locale: Locale) => text[locale]

/**
 * Formats a number for the simulator UI with locale-aware separators.
 */
export const formatNumber = (
  value: number,
  locale: Locale,
  maximumFractionDigits = 2,
) =>
  new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    maximumFractionDigits,
  }).format(value)

/**
 * Formats a numeric value and appends a unit string used in the UI.
 */
export const formatNumberWithUnit = (
  value: number,
  locale: Locale,
  unit: string,
  maximumFractionDigits = 2,
) => `${formatNumber(value, locale, maximumFractionDigits)} ${unit}`.trim()

/**
 * Formats an ordered list of positions such as node or antinode locations.
 */
export const formatPositionList = (
  values: number[],
  locale: Locale,
  unit = 'm',
  maximumFractionDigits = 2,
) => {
  if (values.length === 0) {
    return '—'
  }

  const joiner = locale === 'ja' ? '、' : ', '
  return values
    .map((value) => formatNumberWithUnit(value, locale, unit, maximumFractionDigits))
    .join(joiner)
}
