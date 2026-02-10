import { ProjectMetadata } from "../../domain/entities/index.js";

/**
 * Repository for reading and writing project metadata (.metadata.json files).
 */
export interface MetadataRepository {
  /**
   * Reads metadata for a project by its directory name.
   * @returns The metadata, or null if no .metadata.json exists.
   */
  readMetadata(directoryName: string): Promise<ProjectMetadata | null>;

  /**
   * Writes metadata for a project by its directory name.
   * Creates or overwrites the .metadata.json file.
   */
  writeMetadata(
    directoryName: string,
    metadata: ProjectMetadata
  ): Promise<void>;
}
