import { ReadFileUseCase } from "../../../domain/usecases/read-file.js";
import { InvalidParamError, NotFoundError } from "../../errors/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";
export interface ReadRequest {
  /**
   * The name of the project containing the file.
   */
  projectName: string;

  /**
   * The name of the file to read.
   */
  fileName: string;

  /**
   * Whether to include line numbers as metadata prefix in the returned content.
   * 
   * When enabled, each line is prefixed with its 1-indexed line number followed
   * by a pipe separator (e.g., "1|first line\n2|second line").
   * 
   * This is useful for clients performing patch operations that need line
   * number references.
   * 
   * @default true
   */
  includeLineNumbers?: boolean;

  /**
   * First line to read (1-based indexing).
   * When specified, reading starts from this line.
   * When omitted, reading starts from the beginning of the file.
   */
  startLine?: number;

  /**
   * Last line to read (1-based indexing, inclusive).
   * When specified, reading ends at this line.
   * When omitted, reading continues to the end of the file.
   */
  endLine?: number;

  /**
   * Maximum number of lines to return.
   * When specified with startLine, returns up to maxLines starting from startLine.
   * When specified alone, returns the first maxLines of the file.
   */
  maxLines?: number;
}

export type ReadResponse = string;

export type {
  Controller,
  ReadFileUseCase,
  Request,
  Response,
  Validator,
};
export { InvalidParamError, NotFoundError };
