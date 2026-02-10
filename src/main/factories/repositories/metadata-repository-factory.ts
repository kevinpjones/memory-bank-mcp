import { FsMetadataRepository } from "../../../infra/filesystem/repositories/fs-metadata-repository.js";
import { env } from "../../config/env.js";

export const makeMetadataRepository = (): FsMetadataRepository => {
  return new FsMetadataRepository(env.rootPath);
};
