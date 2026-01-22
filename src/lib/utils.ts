/**
 * Format a number as currency with thousand separators (Portuguese format)
 * Example: 1234567.89 => "1 234 567,89"
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Format a number with thousand separators (Portuguese format)
 * Example: 1234567 => "1 234 567"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-PT")
}
