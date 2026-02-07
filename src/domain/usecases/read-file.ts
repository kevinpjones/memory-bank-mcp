import { File } from "../entities/index.js";
export interface ReadFileParams {
  projectName: string;
  fileName: string;
}

export interface ReadFilePreviewParams {
  projectName: string;
  fileName: string;
  maxLines: number;
}

export interface ReadFilePreviewResult {
  content: string;
  totalLines: number;
}

export interface ReadFilePartialParams {
  projectName: string;
  fileName: string;
  startLine?: number;
  endLine?: number;
  maxLines?: number;
}

export interface ReadFilePartialResult {
  /** The sliced content (lines joined by \n) */
  content: string;
  /** Total number of lines in the file (for line-number padding) */
  totalLines: number;
  /** The 1-based start line of the returned content */
  startLine: number;
}

export interface ReadFileUseCase {
  readFile(params: ReadFileParams): Promise<File | null>;
  /**
   * Reads only the first maxLines from a file using readline.
   */
  readFilePreview(
    params: ReadFilePreviewParams
  ): Promise<ReadFilePreviewResult | null>;
  /**
   * Reads a range of lines from a file using readline.
   * All line counting uses readline semantics for cross-platform consistency.
   * @throws RangeError if startLine exceeds the total number of lines
   */
  readFilePartial(
    params: ReadFilePartialParams
  ): Promise<ReadFilePartialResult | null>;
}
