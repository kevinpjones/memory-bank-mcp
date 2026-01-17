import { GetProjectHistory } from "../../../data/usecases/get-file-history/get-file-history.js";
import { FsHistoryRepository } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetProjectHistory = () => {
  const historyRepository = new FsHistoryRepository(env.rootPath);
  return new GetProjectHistory(historyRepository);
};
