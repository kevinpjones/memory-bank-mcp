import { GetFileHistoryDiff } from "../../../data/usecases/get-file-history-diff/get-file-history-diff.js";
import { FsFileRepository, FsHistoryRepository, FileLockService } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makeGetFileHistoryDiff = () => {
  const lockService = new FileLockService(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath, lockService);
  const fileRepository = new FsFileRepository(env.rootPath);

  return new GetFileHistoryDiff(historyRepository, fileRepository);
};
