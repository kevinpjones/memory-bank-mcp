import fs from "fs-extra";
import path from "path";
import { LockService } from "../../../data/protocols/lock-service.js";
import { ProjectIndexRepository } from "../../../data/protocols/project-index-repository.js";

const INDEX_FILENAME = ".index";
const LOCK_KEY = "project-index";

interface IndexFileContent {
  version: number;
  mappings: Record<string, string>;
}

/**
 * Filesystem implementation of the ProjectIndexRepository protocol.
 * Reads and writes a .index JSON file in the memory bank root directory.
 * Uses file-based locking for concurrent access safety.
 */
export class FsProjectIndexRepository implements ProjectIndexRepository {
  private readonly indexPath: string;

  constructor(
    private readonly rootDir: string,
    private readonly lockService: LockService
  ) {
    this.indexPath = path.join(rootDir, INDEX_FILENAME);
  }

  /**
   * Reads and parses the index file.
   * Returns empty mappings if the file doesn't exist or is corrupt.
   */
  private async readIndex(): Promise<IndexFileContent> {
    try {
      const exists = await fs.pathExists(this.indexPath);
      if (!exists) {
        return { version: 1, mappings: {} };
      }

      const content = await fs.readFile(this.indexPath, "utf-8");
      const parsed = JSON.parse(content);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.mappings !== "object"
      ) {
        return { version: 1, mappings: {} };
      }

      return {
        version: parsed.version ?? 1,
        mappings: parsed.mappings ?? {},
      };
    } catch {
      return { version: 1, mappings: {} };
    }
  }

  /**
   * Writes the index file atomically.
   */
  private async writeIndex(index: IndexFileContent): Promise<void> {
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2) + "\n",
      "utf-8"
    );
  }

  async getDirectoryName(friendlyName: string): Promise<string | null> {
    const index = await this.readIndex();
    return index.mappings[friendlyName] ?? null;
  }

  async setMapping(
    friendlyName: string,
    directoryName: string
  ): Promise<void> {
    const release = await this.lockService.acquireLock(LOCK_KEY);
    try {
      const index = await this.readIndex();
      index.mappings[friendlyName] = directoryName;
      await this.writeIndex(index);
    } finally {
      await release();
    }
  }

  async removeMapping(friendlyName: string): Promise<void> {
    const release = await this.lockService.acquireLock(LOCK_KEY);
    try {
      const index = await this.readIndex();
      delete index.mappings[friendlyName];
      await this.writeIndex(index);
    } finally {
      await release();
    }
  }

  async getAllMappings(): Promise<Record<string, string>> {
    const index = await this.readIndex();
    return { ...index.mappings };
  }

  async rebuildIndex(
    entries: Array<{ friendlyName: string; directoryName: string }>
  ): Promise<void> {
    const release = await this.lockService.acquireLock(LOCK_KEY);
    try {
      const mappings: Record<string, string> = {};
      for (const entry of entries) {
        mappings[entry.friendlyName] = entry.directoryName;
      }
      await this.writeIndex({ version: 1, mappings });
    } finally {
      await release();
    }
  }
}
