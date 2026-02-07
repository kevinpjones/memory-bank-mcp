/**
 * Domain use case interface for searching within a single file
 */

export interface GrepMatch {
  /** The specific line number where the pattern was found (1-indexed) */
  match_line: number;
  /** Starting line number of the context window (1-indexed, inclusive) */
  line_start: number;
  /** Ending line number of the context window (1-indexed, inclusive) */
  line_end: number;
  /** The matched line(s) plus context lines before and after */
  content: string;
}

export interface GrepFileParams {
  /** The project identifier */
  projectName: string;
  /** Path to the file within the project */
  fileName: string;
  /** Search pattern (literal string match) */
  pattern: string;
  /** Number of context lines before and after each match (default: 2) */
  contextLines?: number;
  /** Whether search is case-sensitive (default: true) */
  caseSensitive?: boolean;
}

export interface GrepFileResult {
  /** The file where matches were found */
  file_path: string;
  /** Array of match objects */
  matches: GrepMatch[];
}

export interface GrepFileUseCase {
  grepFile(params: GrepFileParams): Promise<GrepFileResult | null>;
}
