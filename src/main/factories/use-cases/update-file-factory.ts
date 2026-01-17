import { UpdateFile } from "../../../data/usecases/update-file/update-file.js";
import { FsFileRepository, FsHistoryRepository, HistoryTrackingFileRepository } from "../../../infra/filesystem/index.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { env } from "../../config/env.js";

export const makeUpdateFile = () => {
  const projectRepository = new FsProjectRepository(env.rootPath);
  const baseFileRepository = new FsFileRepository(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath);
  const fileRepository = new HistoryTrackingFileRepository(baseFileRepository, historyRepository);

  return new UpdateFile(fileRepository, projectRepository);
};
