import { GetProjectStateAtTime } from "../../../data/usecases/get-project-state-at-time/get-project-state-at-time.js";
import { FsHistoryRepository } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetProjectStateAtTime = () => {
  const historyRepository = new FsHistoryRepository(env.rootPath);
  return new GetProjectStateAtTime(historyRepository);
};
