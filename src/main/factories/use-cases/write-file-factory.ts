import { WriteFile } from "../../../data/usecases/write-file/write-file.js";
import { FsFileRepository, FsHistoryRepository, HistoryTrackingFileRepository } from "../../../infra/filesystem/index.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { env } from "../../config/env.js";

export const makeWriteFile = () => {
  const projectRepository = new FsProjectRepository(env.rootPath);
  const baseFileRepository = new FsFileRepository(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath);
  const fileRepository = new HistoryTrackingFileRepository(baseFileRepository, historyRepository);

  return new WriteFile(fileRepository, projectRepository);
};
