import { MetadataRepository } from "../protocols/metadata-repository.js";
import { ProjectIndexRepository } from "../protocols/project-index-repository.js";
import { ProjectRepository } from "../protocols/project-repository.js";

/**
 * Rebuilds the global project name index from scratch by scanning all project
 * directories and reading their metadata files.
 *
 * This is useful for:
 * - Recovery if the .index file gets corrupted or deleted
 * - Migration when backfilling metadata for existing projects
 * - Ensuring the index is consistent with the filesystem
 *
 * For projects without .metadata.json, the directory name is used as the
 * friendly name (identity mapping).
 */
export async function rebuildProjectIndex(
  projectRepo: ProjectRepository,
  metadataRepo: MetadataRepository,
  indexRepo: ProjectIndexRepository
): Promise<{ total: number; withMetadata: number; withoutMetadata: number }> {
  const projects = await projectRepo.listProjects();

  const entries: Array<{ friendlyName: string; directoryName: string }> = [];
  let withMetadata = 0;
  let withoutMetadata = 0;

  for (const dirName of projects) {
    try {
      const metadata = await metadataRepo.readMetadata(dirName);
      if (metadata) {
        entries.push({
          friendlyName: metadata.friendlyName,
          directoryName: dirName,
        });
        withMetadata++;
      } else {
        // No metadata — use directory name as friendly name
        entries.push({
          friendlyName: dirName,
          directoryName: dirName,
        });
        withoutMetadata++;
      }
    } catch {
      // On error reading metadata, fall back to directory name
      entries.push({
        friendlyName: dirName,
        directoryName: dirName,
      });
      withoutMetadata++;
    }
  }

  await indexRepo.rebuildIndex(entries);

  return {
    total: projects.length,
    withMetadata,
    withoutMetadata,
  };
}
