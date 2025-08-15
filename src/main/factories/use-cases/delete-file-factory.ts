import { DeleteFile } from "../../../data/usecases/delete-file/delete-file.js";
import { FsFileRepository } from "../../../infra/filesystem/repositories/fs-file-repository.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { env } from "../../config/env.js";

export const makeDeleteFileUseCase = () => {
  const fileRepository = new FsFileRepository(env.rootPath);
  const projectRepository = new FsProjectRepository(env.rootPath);
  return new DeleteFile(fileRepository, projectRepository);
};