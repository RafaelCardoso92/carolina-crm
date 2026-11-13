// Portuguese people write money as 33.781,52 (dot thousands, comma decimals). Intl "pt-PT" gives
// "33 781,52" and leaves 4-digit numbers ungrouped ("2144,01"), so de-DE is used: same symbols, always grouped.
const currencyFmt = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numberFmt = new Intl.NumberFormat("de-DE")

/**
 * Format a number as money, without the symbol (callers append " €")
 * Example: 1234567.89 => "1.234.567,89"
 */
export function formatCurrency(value: number): string {
  return currencyFmt.format(value)
}

/**
 * Format a number with thousand separators
 * Example: 1234567 => "1.234.567"
 */
export function formatNumber(value: number): string {
  return numberFmt.format(value)
}
