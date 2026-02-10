import { ProjectNameResolver } from "../../../data/services/project-name-resolver.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { makeProjectIndexRepository } from "../repositories/project-index-repository-factory.js";
import { env } from "../../config/env.js";

export const makeProjectNameResolver = (): ProjectNameResolver => {
  const projectRepository = new FsProjectRepository(env.rootPath);
  const indexRepository = makeProjectIndexRepository();
  return new ProjectNameResolver(projectRepository, indexRepository);
};
