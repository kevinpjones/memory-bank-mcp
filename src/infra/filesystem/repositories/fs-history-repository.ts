import fs from "fs-extra";
import path from "path";
import { HistoryRepository } from "../../../data/protocols/history-repository.js";
import { LockService } from "../../../data/protocols/lock-service.js";
import {
  HistoryEntry,
  RecordHistoryParams,
  ProjectStateAtTime,
} from "../../../domain/entities/index.js";
import { HistoryEntryMetadata } from "../../../domain/usecases/get-file-history.js";

/**
 * Filesystem implementation of the HistoryRepository protocol
 * Stores history entries in JSONL format in .history/<project-name>/<filename>.history.jsonl
 */
export class FsHistoryRepository implements HistoryRepository {
  private readonly historyDir: string;

  /**
   * Creates a new FsHistoryRepository
   * @param rootDir The root directory where all projects are stored
   * @param lockService The lock service for preventing race conditions
   */
  constructor(
    private readonly rootDir: string,
    private readonly lockService: LockService
  ) {
    this.historyDir = path.join(rootDir, ".history");
  }

  /**
   * Gets the path to the history file for a specific file
   */
  private getHistoryFilePath(projectName: string, fileName: string): string {
    return path.join(this.historyDir, projectName, `${fileName}.history.jsonl`);
  }

  /**
   * Gets the path to the history directory for a project
   */
  private getProjectHistoryDir(projectName: string): string {
    return path.join(this.historyDir, projectName);
  }

  /**
   * Gets the next version number for the project (project-wide sequential versioning)
   */
  private async getNextVersion(projectName: string): Promise<number> {
    const projectHistory = await this.getProjectHistory(projectName);
    if (projectHistory.length === 0) {
      return 1;
    }
    // Get the maximum version number across all files in the project and add 1
    const maxVersion = Math.max(...projectHistory.map(e => e.version ?? 0));
    return maxVersion + 1;
  }

  /**
   * Records a history entry for a file change
   * Uses per-project locking to prevent race conditions in version assignment
   */
  async recordHistory(params: RecordHistoryParams): Promise<void> {
    const { action, actor, projectName, fileName, content } = params;

    // Acquire lock to prevent concurrent version assignment
    const releaseLock = await this.lockService.acquireLock(projectName);
    
    try {
      // Calculate the next version number for the project (project-wide versioning)
      const version = await this.getNextVersion(projectName);

      const entry: HistoryEntry = {
        version,
        timestamp: new Date().toISOString(),
        action,
        actor,
        projectName,
        fileName,
        content,
      };

      const historyFilePath = this.getHistoryFilePath(projectName, fileName);
      const historyDir = path.dirname(historyFilePath);

      // Ensure history directory exists
      await fs.ensureDir(historyDir);

      // Append entry as a JSON line
      const jsonLine = JSON.stringify(entry) + "\n";
      await fs.appendFile(historyFilePath, jsonLine, "utf-8");
    } finally {
      // Always release the lock, even if an error occurs
      await releaseLock();
    }
  }

  /**
   * Gets the history for a specific file
   */
  async getFileHistory(projectName: string, fileName: string): Promise<HistoryEntry[]> {
    const historyFilePath = this.getHistoryFilePath(projectName, fileName);

    const fileExists = await fs.pathExists(historyFilePath);
    if (!fileExists) {
      return [];
    }

    const content = await fs.readFile(historyFilePath, "utf-8");
    const lines = content.trim().split("\n").filter(line => line.length > 0);

    const entries: HistoryEntry[] = lines.map(line => JSON.parse(line));

    // Sort by timestamp ascending
    return entries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Gets the history for all files in a project
   */
  async getProjectHistory(projectName: string): Promise<HistoryEntry[]> {
    const projectHistoryDir = this.getProjectHistoryDir(projectName);

    const dirExists = await fs.pathExists(projectHistoryDir);
    if (!dirExists) {
      return [];
    }

    const entries = await fs.readdir(projectHistoryDir, { withFileTypes: true });
    const historyFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith(".history.jsonl"))
      .map(entry => entry.name);

    const allEntries: HistoryEntry[] = [];

    for (const historyFile of historyFiles) {
      // Extract original filename from history filename (use regex with end anchor to handle filenames containing .history.jsonl)
      const fileName = historyFile.replace(/\.history\.jsonl$/, "");
      const fileHistory = await this.getFileHistory(projectName, fileName);
      allEntries.push(...fileHistory);
    }

    // Sort by timestamp ascending
    return allEntries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Reconstructs the complete project state at a specific point in time
   */
  async getStateAtTime(projectName: string, timestamp: string): Promise<ProjectStateAtTime> {
    const targetTime = new Date(timestamp).getTime();
    const projectHistory = await this.getProjectHistory(projectName);

    // Filter entries up to and including the target timestamp
    const relevantEntries = projectHistory.filter(
      entry => new Date(entry.timestamp).getTime() <= targetTime
    );

    // Build the state by applying entries in order
    const fileStates = new Map<string, string | null>();

    for (const entry of relevantEntries) {
      if (entry.action === "deleted") {
        fileStates.set(entry.fileName, null);
      } else {
        fileStates.set(entry.fileName, entry.content);
      }
    }

    // Filter out deleted files (those with null content)
    const files = new Map<string, string>();
    for (const [fileName, content] of fileStates) {
      if (content !== null) {
        files.set(fileName, content);
      }
    }

    return {
      timestamp,
      files,
    };
  }

  /**
   * Gets the history metadata (without content) for all files in a project
   */
  async getProjectHistoryMetadata(projectName: string): Promise<HistoryEntryMetadata[]> {
    const projectHistory = await this.getProjectHistory(projectName);

    // Map to metadata (exclude content)
    return projectHistory.map(entry => ({
      version: entry.version,
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      fileName: entry.fileName,
    }));
  }

  /**
   * Gets the content of a specific file at a specific point in time
   */
  async getFileAtTime(projectName: string, fileName: string, timestamp: string): Promise<string | null> {
    const targetTime = new Date(timestamp).getTime();
    const fileHistory = await this.getFileHistory(projectName, fileName);

    // Filter entries up to and including the target timestamp
    const relevantEntries = fileHistory.filter(
      entry => new Date(entry.timestamp).getTime() <= targetTime
    );

    if (relevantEntries.length === 0) {
      return null;
    }

    // Get the last entry (most recent state at or before timestamp)
    const lastEntry = relevantEntries[relevantEntries.length - 1];

    // If the file was deleted, return null
    if (lastEntry.action === "deleted") {
      return null;
    }

    return lastEntry.content;
  }

  /**
   * Gets the content of a specific file at a specific version
   */
  async getFileByVersion(projectName: string, fileName: string, version: number): Promise<string | null> {
    const fileHistory = await this.getFileHistory(projectName, fileName);

    // Find the entry with the specified version
    const entry = fileHistory.find(e => e.version === version);

    if (!entry) {
      return null;
    }

    // If the file was deleted at this version, return null
    if (entry.action === "deleted") {
      return null;
    }

    return entry.content;
  }
}
