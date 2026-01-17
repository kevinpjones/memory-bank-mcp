import { HistoryEntry } from "../entities/index.js";

export interface GetFileHistoryParams {
  projectName: string;
  fileName: string;
}

export interface GetFileHistoryUseCase {
  getFileHistory(params: GetFileHistoryParams): Promise<HistoryEntry[]>;
}
