import {
  HistoryRepository,
  HistoryEntryMetadata,
  GetProjectHistoryParams,
  GetProjectHistoryUseCase,
} from "./get-file-history-protocols.js";

export class GetProjectHistory implements GetProjectHistoryUseCase {
  constructor(private readonly historyRepository: HistoryRepository) {}

  async getProjectHistory(params: GetProjectHistoryParams): Promise<HistoryEntryMetadata[]> {
    const { projectName } = params;
    return this.historyRepository.getProjectHistoryMetadata(projectName);
  }
}
