import { GetFileHistoryDiffUseCase, GetFileHistoryDiffResult } from "../../../domain/usecases/get-file-history-diff.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GetFileHistoryDiffRequest {
  /**
   * The name of the project containing the file.
   */
  projectName: string;

  /**
   * The name of the file to diff.
   */
  fileName: string;

  /**
   * Source version number (1-based).
   */
  versionFrom: number;

  /**
   * Target version number (1-based, optional - defaults to current/latest version).
   */
  versionTo?: number;
}

export type GetFileHistoryDiffResponse = GetFileHistoryDiffResult;

export type {
  Controller,
  GetFileHistoryDiffUseCase,
  GetFileHistoryDiffResult,
  Request,
  Response,
  Validator,
};
