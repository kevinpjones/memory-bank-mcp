import { PatchFileUseCase } from "../../../domain/usecases/patch-file.js";
import {
  ContentMismatchError,
  InvalidLineRangeError,
  NotFoundError,
} from "../../errors/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface PatchRequest {
  projectName: string;
  fileName: string;
  startLine: number;
  endLine: number;
  oldContent: string;
  newContent: string;
}

export type PatchResponse = string;

export type {
  Controller,
  PatchFileUseCase,
  Request,
  Response,
  Validator,
};
export { NotFoundError, ContentMismatchError, InvalidLineRangeError };
