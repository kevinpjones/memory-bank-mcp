import { FsPromptRepository } from "../../../infra/filesystem/index.js";
import { env } from "../../config/env.js";

export const makePromptRepository = (): FsPromptRepository => {
  return new FsPromptRepository(env.rootPath);
};