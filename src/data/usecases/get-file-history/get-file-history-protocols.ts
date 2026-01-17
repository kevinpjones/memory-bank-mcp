import {
  GetFileHistoryParams,
  GetFileHistoryUseCase,
} from "../../../domain/usecases/index.js";
import { HistoryEntry } from "../../../domain/entities/index.js";
import { HistoryRepository } from "../../protocols/index.js";

export type { HistoryRepository, HistoryEntry, GetFileHistoryParams, GetFileHistoryUseCase };
