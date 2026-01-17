import { GetProjectHistory } from "../../../data/usecases/get-file-history/get-file-history.js";
import { FsHistoryRepository, FileLockService } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetProjectHistory = () => {
  const lockService = new FileLockService(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath, lockService);
  return new GetProjectHistory(historyRepository);
};
