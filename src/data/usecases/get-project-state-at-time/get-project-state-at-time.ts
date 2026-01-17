import {
  HistoryRepository,
  ProjectStateAtTime,
  GetProjectStateAtTimeParams,
  GetProjectStateAtTimeUseCase,
} from "./get-project-state-at-time-protocols.js";

export class GetProjectStateAtTime implements GetProjectStateAtTimeUseCase {
  constructor(private readonly historyRepository: HistoryRepository) {}

  async getProjectStateAtTime(params: GetProjectStateAtTimeParams): Promise<ProjectStateAtTime> {
    const { projectName, timestamp } = params;
    return this.historyRepository.getStateAtTime(projectName, timestamp);
  }
}
