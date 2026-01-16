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
 * Checks if content appears to have line number prefixes from addLineNumbers().
 * 
 * This function uses strict validation to avoid false positives with content
 * that naturally contains digit-pipe patterns (like markdown tables or
 * pipe-delimited data). It requires:
 * 1. ALL lines must have the line number prefix pattern
 * 2. Line numbers must be sequential (1, 2, 3, ...)
 * 3. Minimum 2 lines to establish a pattern (single lines are ambiguous)
 * 
 * @param content - Content to check
 * @returns True if content appears to have line number prefixes
 * 
 * @example
 * hasLineNumbers("1|hello\n2|world") // true - sequential line numbers
 * hasLineNumbers("1|hello") // false - single line is ambiguous
 * hasLineNumbers("1|foo\n3|bar") // false - non-sequential
 * hasLineNumbers("| 1 | data |") // false - doesn't match pattern
 */
export function hasLineNumbers(content: string): boolean {
  if (!content) {
    return false;
  }

  // Split and filter out trailing empty line caused by trailing newline
  // e.g., "1|line\n2|line\n".split('\n') = ["1|line", "2|line", ""]
  // We keep internal empty lines but remove trailing empty string
  let lines = content.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines = lines.slice(0, -1);
  }
  
  // Require at least 2 lines to establish a sequential pattern
  // Single lines are ambiguous (could be "1|actual data")
  if (lines.length < 2) {
    return false;
  }

  // Pattern to extract line number: optional whitespace, digits, pipe
  const lineNumberPattern = /^\s*(\d+)\|/;
  
  let previousLineNum = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(lineNumberPattern);
    
    // ALL lines must match the pattern
    if (!match) {
      return false;
    }
    
    const lineNum = parseInt(match[1], 10);
    
    // Line numbers must be sequential (each line number = previous + 1)
    // First line can start at any number (to support partial content)
    if (i > 0 && lineNum !== previousLineNum + 1) {
      return false;
    }
    
    previousLineNum = lineNum;
  }
  
  return true;
}
