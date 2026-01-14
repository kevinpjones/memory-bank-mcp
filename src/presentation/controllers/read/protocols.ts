import { ReadFileUseCase } from "../../../domain/usecases/read-file.js";
import { NotFoundError } from "../../errors/index.js";
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
}

export type ReadResponse = string;

export type {
  Controller,
  ReadFileUseCase,
  Request,
  Response,
  Validator,
};
export { NotFoundError };
