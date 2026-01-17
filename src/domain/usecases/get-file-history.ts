import { HistoryEntry } from "../entities/index.js";

export interface GetProjectHistoryParams {
  projectName: string;
}

/**
 * History entry metadata without content for efficient listing
 */
export interface HistoryEntryMetadata {
  timestamp: string;
  action: HistoryEntry["action"];
  actor: string;
  fileName: string;
}

export interface GetProjectHistoryUseCase {
  getProjectHistory(params: GetProjectHistoryParams): Promise<HistoryEntryMetadata[]>;
}
