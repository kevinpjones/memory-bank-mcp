import { GetProjectHistoryUseCase, HistoryEntryMetadata } from "../../../domain/usecases/get-file-history.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GetProjectHistoryRequest {
  /**
   * The name of the project to get history for.
   */
  projectName: string;
}

export type GetProjectHistoryResponse = HistoryEntryMetadata[];

export type {
  Controller,
  GetProjectHistoryUseCase,
  HistoryEntryMetadata,
  Request,
  Response,
  Validator,
};
