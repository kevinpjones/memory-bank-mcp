import { McpServerAdapter } from "./adapters/mcp-server-adapter.js";
import routes from "./routes.js";
import { rebuildProjectIndex } from "../../../data/services/rebuild-index.js";
import { FsProjectRepository } from "../../../infra/filesystem/repositories/fs-project-repository.js";
import { makeMetadataRepository } from "../../factories/repositories/metadata-repository-factory.js";
import { makeProjectIndexRepository } from "../../factories/repositories/project-index-repository-factory.js";
import { env } from "../../config/env.js";

const router = routes();
const app = new McpServerAdapter(router);

app.register({
  name: "memory-bank",
  version: "1.0.0",
});

// Rebuild project index on startup to ensure consistency with the filesystem.
// Runs asynchronously and does not block server startup.
rebuildProjectIndex(
  new FsProjectRepository(env.rootPath),
  makeMetadataRepository(),
  makeProjectIndexRepository()
).catch(() => {
  // Index rebuild failure should not prevent the server from starting
});

export default app;
