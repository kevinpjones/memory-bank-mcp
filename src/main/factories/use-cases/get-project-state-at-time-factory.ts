import { GetFileAtTime } from "../../../data/usecases/get-project-state-at-time/get-project-state-at-time.js";
import { FsHistoryRepository, FileLockService } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetFileAtTime = () => {
  const lockService = new FileLockService(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath, lockService);
  return new GetFileAtTime(historyRepository);
};
