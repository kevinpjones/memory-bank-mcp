/**
 * Utility functions for normalizing content for comparison.
 *
 * These functions handle cross-platform line ending differences and
 * provide consistent content normalization for safe patching operations.
 */

/**
 * Normalizes line endings in content to Unix-style LF (\n).
 *
 * Handles:
 * - Windows CRLF (\r\n) -> LF (\n)
 * - Old Mac CR (\r) -> LF (\n)
 * - Already Unix LF (\n) -> unchanged
 * - Mixed line endings -> all become LF (\n)
 *
 * @param content - The content string to normalize
 * @returns Content with all line endings converted to LF (\n)
 *
 * @example
 * normalizeLineEndings("line1\r\nline2\rline3\nline4")
 * // Returns: "line1\nline2\nline3\nline4"
 */
export function normalizeLineEndings(content: string): string {
  if (!content) {
    return content;
  }

  // First replace CRLF (\r\n) with LF (\n) to avoid double replacement
  // Then replace standalone CR (\r) with LF (\n)
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Normalizes content for comparison by:
 * 1. Normalizing all line endings to LF (\n)
 * 2. Optionally trimming a single trailing newline for flexibility
 *
 * This function is specifically designed for the patch content matching
 * use case where we need to compare expected content against actual
 * file content without false negatives due to line ending differences.
 *
 * Security note: This function preserves the semantic content and only
 * normalizes line endings. It does NOT trim whitespace from lines or
 * remove empty lines, which could mask unintended changes.
 *
 * @param content - The content string to normalize
 * @param trimTrailingNewline - Whether to trim a single trailing newline (default: true)
 * @returns Normalized content suitable for comparison
 *
 * @example
 * normalizeForComparison("line1\r\nline2\n")
 * // Returns: "line1\nline2"
 *
 * @example
 * normalizeForComparison("line1\r\nline2\n", false)
 * // Returns: "line1\nline2\n"
 */
export function normalizeForComparison(
  content: string,
  trimTrailingNewline: boolean = true
): string {
  if (!content) {
    return content;
  }

  let normalized = normalizeLineEndings(content);

  // Optionally trim at most one trailing newline for flexibility
  // Using /\n$/ instead of /\n+$/ to preserve distinction between empty lines
  if (trimTrailingNewline) {
    normalized = normalized.replace(/\n$/, "");
  }

  return normalized;
}
