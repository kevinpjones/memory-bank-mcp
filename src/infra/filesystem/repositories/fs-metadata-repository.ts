import fs from "fs-extra";
import path from "path";
import { MetadataRepository } from "../../../data/protocols/metadata-repository.js";
import { ProjectMetadata } from "../../../domain/entities/index.js";

const METADATA_FILENAME = ".metadata.json";

/**
 * Filesystem implementation of the MetadataRepository protocol.
 * Reads and writes .metadata.json files inside each project directory.
 */
export class FsMetadataRepository implements MetadataRepository {
  constructor(private readonly rootDir: string) {}

  /**
   * Reads metadata for a project by its directory name.
   * @returns The metadata, or null if no .metadata.json exists or is invalid.
   */
  async readMetadata(directoryName: string): Promise<ProjectMetadata | null> {
    const metadataPath = path.join(
      this.rootDir,
      directoryName,
      METADATA_FILENAME
    );

    try {
      const exists = await fs.pathExists(metadataPath);
      if (!exists) {
        return null;
      }

      const content = await fs.readFile(metadataPath, "utf-8");
      const parsed = JSON.parse(content);

      // Validate required fields
      if (
        typeof parsed.friendlyName !== "string" ||
        typeof parsed.directoryName !== "string" ||
        typeof parsed.createdAt !== "string"
      ) {
        return null;
      }

      return {
        friendlyName: parsed.friendlyName,
        directoryName: parsed.directoryName,
        createdAt: parsed.createdAt,
      };
    } catch {
      // Return null for any read/parse errors (corrupt file, permissions, etc.)
      return null;
    }
  }

  /**
   * Writes metadata for a project by its directory name.
   * Creates or overwrites the .metadata.json file.
   */
  async writeMetadata(
    directoryName: string,
    metadata: ProjectMetadata
  ): Promise<void> {
    const metadataPath = path.join(
      this.rootDir,
      directoryName,
      METADATA_FILENAME
    );

    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2) + "\n",
      "utf-8"
    );
  }
}
