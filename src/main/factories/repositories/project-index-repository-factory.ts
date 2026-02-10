import { FsProjectIndexRepository } from "../../../infra/filesystem/repositories/fs-project-index-repository.js";
import { FileLockService } from "../../../infra/filesystem/services/file-lock-service.js";
import { env } from "../../config/env.js";

export const makeProjectIndexRepository = (): FsProjectIndexRepository => {
  const lockService = new FileLockService(env.rootPath);
  return new FsProjectIndexRepository(env.rootPath, lockService);
};
