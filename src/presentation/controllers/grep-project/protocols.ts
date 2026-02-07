import { GrepProjectUseCase } from "../../../domain/usecases/grep-project.js";
import { InvalidParamError } from "../../errors/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GrepProjectRequest {
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

export type GrepProjectResponse = {
  results: Array<{
    file_path: string;
    matches: Array<{
      match_line: number;
      line_start: number;
      line_end: number;
      content: string;
    }>;
  }>;
  total_matches: number;
  truncated: boolean;
};

export type {
  Controller,
  GrepProjectUseCase,
  Request,
  Response,
  Validator,
};
export { InvalidParamError };
