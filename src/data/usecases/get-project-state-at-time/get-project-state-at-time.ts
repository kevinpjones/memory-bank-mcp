import {
  HistoryRepository,
  GetFileAtTimeParams,
  GetFileAtTimeResult,
  GetFileAtTimeUseCase,
} from "./get-project-state-at-time-protocols.js";

export class GetFileAtTime implements GetFileAtTimeUseCase {
  constructor(private readonly historyRepository: HistoryRepository) {}

  async getFileAtTime(params: GetFileAtTimeParams): Promise<GetFileAtTimeResult> {
    const { projectName, fileName, timestamp } = params;
    const content = await this.historyRepository.getFileAtTime(projectName, fileName, timestamp);
    
    return {
      timestamp,
      content,
      exists: content !== null,
    };
  }
}
