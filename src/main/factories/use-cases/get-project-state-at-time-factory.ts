import { GetFileAtTime } from "../../../data/usecases/get-project-state-at-time/get-project-state-at-time.js";
import { FsHistoryRepository } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetFileAtTime = () => {
  const historyRepository = new FsHistoryRepository(env.rootPath);
  return new GetFileAtTime(historyRepository);
};
