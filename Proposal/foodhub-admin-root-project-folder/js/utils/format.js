/**
 * Number formatting utilities
 */

/**
 * Strip trailing zeros from decimal numbers
 * Examples:
 *   61.000  → "61"
 *   1.500   → "1.5"
 *   0.250   → "0.25"
 *   10      → "10"
 */
export function formatQuantity(value) {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    // Use toString() to strip trailing zeros, fallback to toFixed(3) for precision
    return num.toString();
}

/**
 * Format with unit (for display with kg, pcs, etc.)
 */
export function formatQuantityWithUnit(value, unit) {
    return `${formatQuantity(value)} ${unit ?? ''}`.trim();
}