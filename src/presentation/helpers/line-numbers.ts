/**
 * Utility functions for adding line numbers to content.
 * 
 * Line numbers are added as metadata prefix to each line, making it easy
 * for clients to parse and use for patch operations.
 * 
 * Format: `{lineNumber}|{content}`
 * - Line numbers are 1-indexed (matching standard editor conventions)
 * - Pipe separator (|) provides clear, unambiguous parsing
 * - Line numbers are right-padded to maintain alignment for readability
 * 
 * @example
 * // Input:
 * "first line\nsecond line\nthird line"
 * 
 * // Output (with line numbers):
 * "1|first line\n2|second line\n3|third line"
 */

/**
 * Adds line numbers as metadata prefix to each line of content.
 * 
 * @param content - The raw content string to add line numbers to
 * @returns Content with line numbers prefixed to each line
 * 
 * @example
 * addLineNumbers("hello\nworld")
 * // Returns: "1|hello\n2|world"
 */
export function addLineNumbers(content: string): string {
  if (!content) {
    return content;
  }

  const lines = content.split('\n');
  const totalLines = lines.length;
  const padding = String(totalLines).length;

  return lines
    .map((line, index) => {
      const lineNumber = String(index + 1).padStart(padding, ' ');
      return `${lineNumber}|${line}`;
    })
    .join('\n');
}

/**
 * Strips line number prefixes from content.
 * This is useful for ensuring content written to disk doesn't contain
 * line number metadata that may have been accidentally included.
 * 
 * @param content - Content potentially containing line number prefixes
 * @returns Content with line number prefixes removed
 * 
 * @example
 * stripLineNumbers("1|hello\n2|world")
 * // Returns: "hello\nworld"
 */
export function stripLineNumbers(content: string): string {
  if (!content) {
    return content;
  }

  // Pattern matches: optional whitespace, digits, pipe, then captures the rest
  // This handles both padded (e.g., "  1|") and non-padded (e.g., "1|") formats
  const lineNumberPattern = /^\s*\d+\|/;

  return content
    .split('\n')
    .map(line => {
      if (lineNumberPattern.test(line)) {
        return line.replace(lineNumberPattern, '');
      }
      return line;
    })
    .join('\n');
}

/**
 * Checks if content appears to have line number prefixes.
 * 
 * @param content - Content to check
 * @returns True if content appears to have line number prefixes
 */
export function hasLineNumbers(content: string): boolean {
  if (!content) {
    return false;
  }

  const lines = content.split('\n');
  if (lines.length === 0) {
    return false;
  }

  // Check if the first few non-empty lines match the line number pattern
  const lineNumberPattern = /^\s*\d+\|/;
  const samplesToCheck = Math.min(3, lines.length);
  let matchCount = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    if (lineNumberPattern.test(lines[i])) {
      matchCount++;
    }
  }

  // Consider it has line numbers if most sample lines match
  return matchCount >= Math.ceil(samplesToCheck / 2);
}
