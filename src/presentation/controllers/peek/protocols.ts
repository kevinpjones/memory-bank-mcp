import { ReadFileUseCase } from "../../../domain/usecases/read-file.js";
import { InvalidParamError, NotFoundError } from "../../errors/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface PeekFileRequest {
  /**
   * The name of the project containing the file.
   */
  projectName: string;

  /**
   * The name of the file to peek at.
   */
  fileName: string;

  /**
   * Number of lines to include in the preview.
   * @default 10
   */
  previewLines?: number;
}

export interface PeekFileResponse {
  /**
   * Total number of lines in the file.
   */
  totalLines: number;

  /**
   * The file name.
   */
  fileName: string;

  /**
   * Number of preview lines returned.
   */
  previewLineCount: number;

  /**
   * The preview content (first N lines with line numbers).
   */
  preview: string;
}

export type {
  Controller,
  ReadFileUseCase,
  Request,
  Response,
  Validator,
};
export { InvalidParamError, NotFoundError };
