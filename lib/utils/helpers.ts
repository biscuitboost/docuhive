/**
 * Utility functions for DocuHive.
 */

/**
 * Formats a number as GBP currency.
 * @example formatCurrency(49.99) // "£49.99"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date to a human-readable UK locale string.
 * @example formatDate(new Date("2025-06-01")) // "1 June 2025"
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

/**
 * Converts a string to a URL-friendly slug.
 * @example slugify("Employment Contract") // "employment-contract"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique document reference number.
 * Format: DH-YYYYMM-XXXXX (DocuHive prefix, year-month, random alphanumeric)
 * @example generateDocNumber() // "DH-202506-A3F8K"
 */
export function generateDocNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DH-${year}${month}-${random}`;
}
