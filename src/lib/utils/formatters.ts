/**
 * Formats a number with thousands separators and 2 decimal places.
 * No currency symbol — display-agnostic.
 * @example formatAmount(12345.6) => "12,345.60"
 */
export function formatAmount(n: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(n));
}

/**
 * Short form — no decimals, for dashboard summary metrics.
 * @example formatAmountShort(12345.6) => "12,346"
 */
export function formatAmountShort(n: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.abs(n));
}
