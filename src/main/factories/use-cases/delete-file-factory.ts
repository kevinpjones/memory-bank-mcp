import { DeleteFile } from "../../../data/usecases/delete-file/delete-file.js";
import { FsFileRepository } from "../../../infra/filesystem/repositories/fs-file-repository.js";
import { FsHistoryRepository } from "../../../infra/filesystem/repositories/fs-history-repository.js";
import { HistoryTrackingFileRepository } from "../../../infra/filesystem/repositories/history-tracking-file-repository.js";
import { FileLockService } from "../../../infra/filesystem/services/file-lock-service.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { env } from "../../config/env.js";

export const makeDeleteFileUseCase = () => {
  const baseFileRepository = new FsFileRepository(env.rootPath);
  const lockService = new FileLockService(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath, lockService);
  const fileRepository = new HistoryTrackingFileRepository(baseFileRepository, historyRepository);
  const projectRepository = new FsProjectRepository(env.rootPath);
  return new DeleteFile(fileRepository, projectRepository);
};