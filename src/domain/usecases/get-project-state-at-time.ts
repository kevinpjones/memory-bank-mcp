import { ProjectStateAtTime } from "../entities/index.js";

export interface GetProjectStateAtTimeParams {
  projectName: string;
  timestamp: string;
}

export interface GetProjectStateAtTimeUseCase {
  getProjectStateAtTime(params: GetProjectStateAtTimeParams): Promise<ProjectStateAtTime>;
}
