import { PatchFile } from "../../../data/usecases/patch-file/patch-file.js";
import { FsFileRepository, FsHistoryRepository, HistoryTrackingFileRepository } from "../../../infra/filesystem/index.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { env } from "../../config/env.js";

export const makePatchFile = () => {
  const projectRepository = new FsProjectRepository(env.rootPath);
  const baseFileRepository = new FsFileRepository(env.rootPath);
  const historyRepository = new FsHistoryRepository(env.rootPath);
  const fileRepository = new HistoryTrackingFileRepository(baseFileRepository, historyRepository);

  return new PatchFile(fileRepository, projectRepository);
};
