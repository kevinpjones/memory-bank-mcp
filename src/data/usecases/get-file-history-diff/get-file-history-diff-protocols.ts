import {
  GetFileHistoryDiffParams,
  GetFileHistoryDiffResult,
  GetFileHistoryDiffUseCase,
} from "../../../domain/usecases/index.js";
import { HistoryRepository } from "../../protocols/index.js";
import { FileRepository } from "../../protocols/index.js";

export type {
  GetFileHistoryDiffParams,
  GetFileHistoryDiffResult,
  GetFileHistoryDiffUseCase,
  HistoryRepository,
  FileRepository,
};
