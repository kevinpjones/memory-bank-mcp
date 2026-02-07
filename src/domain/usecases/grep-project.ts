/**
 * Domain use case interface for searching across all files in a project
 */

import { GrepMatch } from "./grep-file.js";

export interface GrepProjectParams {
  /** The project identifier */
  projectName: string;
  /** Search pattern (literal string match) */
  pattern: string;
  /** Number of context lines before and after each match (default: 2) */
  contextLines?: number;
  /** Whether search is case-sensitive (default: true) */
  caseSensitive?: boolean;
  /** Maximum number of matches to return across all files (default: 100) */
  maxResults?: number;
}

export interface GrepProjectFileResult {
  /** The file where matches were found */
  file_path: string;
  /** Array of match objects */
  matches: GrepMatch[];
}

export interface GrepProjectResult {
  /** Results grouped by file */
  results: GrepProjectFileResult[];
  /** Total number of matches found */
  total_matches: number;
  /** Whether results were truncated due to max_results */
  truncated: boolean;
}

export interface GrepProjectUseCase {
  grepProject(params: GrepProjectParams): Promise<GrepProjectResult | null>;
}
