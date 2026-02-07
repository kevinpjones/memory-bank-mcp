import { GrepFileUseCase } from "../../../domain/usecases/grep-file.js";
import { InvalidParamError } from "../../errors/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GrepFileRequest {
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

export type GrepFileResponse = {
  file_path: string;
  matches: Array<{
    match_line: number;
    line_start: number;
    line_end: number;
    content: string;
  }>;
};

export type {
  Controller,
  GrepFileUseCase,
  Request,
  Response,
  Validator,
};
export { InvalidParamError };
