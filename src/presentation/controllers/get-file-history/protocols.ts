import { GetFileHistoryUseCase } from "../../../domain/usecases/get-file-history.js";
import { HistoryEntry } from "../../../domain/entities/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GetFileHistoryRequest {
  /**
   * The name of the project containing the file.
   */
  projectName: string;

  /**
   * The name of the file to get history for.
   */
  fileName: string;
}

export type GetFileHistoryResponse = HistoryEntry[];

export type {
  Controller,
  GetFileHistoryUseCase,
  HistoryEntry,
  Request,
  Response,
  Validator,
};
