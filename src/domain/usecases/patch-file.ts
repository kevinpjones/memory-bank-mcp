import { File } from "../entities/index.js";

export interface PatchFileParams {
  projectName: string;
  fileName: string;
  startLine: number;
  endLine: number;
  oldContent: string;
  newContent: string;
}

export interface PatchFileErrorContext {
  /** Total lines in file (for INVALID_LINE_RANGE errors) */
  totalLines?: number;
  /** Actual content at the specified location (for CONTENT_MISMATCH errors) */
  actualContent?: string;
}

export interface PatchFileResult {
  success: boolean;
  content?: File;
  error?: PatchFileError;
  errorContext?: PatchFileErrorContext;
}

export type PatchFileError =
  | "PROJECT_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "INVALID_LINE_RANGE"
  | "CONTENT_MISMATCH";

export interface PatchFileUseCase {
  patchFile(params: PatchFileParams): Promise<PatchFileResult>;
}
