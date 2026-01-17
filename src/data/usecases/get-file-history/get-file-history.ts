import {
  HistoryRepository,
  HistoryEntry,
  GetFileHistoryParams,
  GetFileHistoryUseCase,
} from "./get-file-history-protocols.js";

export class GetFileHistory implements GetFileHistoryUseCase {
  constructor(private readonly historyRepository: HistoryRepository) {}

  async getFileHistory(params: GetFileHistoryParams): Promise<HistoryEntry[]> {
    const { projectName, fileName } = params;
    return this.historyRepository.getFileHistory(projectName, fileName);
  }
}
