import { FileRepository } from "../../../data/protocols/file-repository.js";
import { HistoryRepository } from "../../../data/protocols/history-repository.js";
import { File } from "../../../domain/entities/index.js";

/**
 * Decorator that wraps a FileRepository and tracks all file changes in history.
 * This follows the decorator pattern to add history tracking to any FileRepository
 * implementation without modifying the wrapped repository.
 */
export class HistoryTrackingFileRepository implements FileRepository {
  /**
   * Creates a new HistoryTrackingFileRepository
   * @param wrappedRepository The FileRepository to wrap and proxy requests to
   * @param historyRepository The HistoryRepository to record changes to
   * @param actor The actor identifier for history entries (default: "mcp-server")
   */
  constructor(
    private readonly wrappedRepository: FileRepository,
    private readonly historyRepository: HistoryRepository,
    private readonly actor: string = "mcp-server"
  ) {}

  /**
   * Lists all files in a project (proxied to wrapped repository)
   */
  async listFiles(projectName: string): Promise<File[]> {
    return this.wrappedRepository.listFiles(projectName);
  }

  /**
   * Loads the content of a file (proxied to wrapped repository)
   */
  async loadFile(projectName: string, fileName: string): Promise<string | null> {
    return this.wrappedRepository.loadFile(projectName, fileName);
  }

  /**
   * Loads file lines (proxied to wrapped repository)
   */
  async loadFileLines(
    projectName: string,
    fileName: string
  ): Promise<string[] | null> {
    return this.wrappedRepository.loadFileLines(projectName, fileName);
  }

  /**
   * Writes a new file and records the creation in history
   */
  async writeFile(
    projectName: string,
    fileName: string,
    content: string
  ): Promise<File | null> {
    const result = await this.wrappedRepository.writeFile(projectName, fileName, content);

    // Only record history if the write was successful
    if (result !== null) {
      await this.historyRepository.recordHistory({
        action: "created",
        actor: this.actor,
        projectName,
        fileName,
        content,
      });
    }

    return result;
  }

  /**
   * Updates an existing file and records the modification in history
   */
  async updateFile(
    projectName: string,
    fileName: string,
    content: string
  ): Promise<File | null> {
    const result = await this.wrappedRepository.updateFile(projectName, fileName, content);

    // Only record history if the update was successful
    if (result !== null) {
      await this.historyRepository.recordHistory({
        action: "modified",
        actor: this.actor,
        projectName,
        fileName,
        content,
      });
    }

    return result;
  }

  /**
   * Deletes a file by recording the deletion in history first, then removing it.
   * 
   * History is recorded BEFORE deletion to prevent unrecoverable data loss.
   * If history recording fails, the file remains intact.
   * If deletion fails after history is recorded, we have a minor inconsistency
   * (history shows deleted but file exists) which is far less severe than
   * losing the file without any history record.
   */
  async deleteFile(projectName: string, fileName: string): Promise<boolean> {
    // Read file content before deletion for history
    const content = await this.wrappedRepository.loadFile(projectName, fileName);
    
    if (content === null) {
      return false;
    }

    // Record history FIRST to ensure content is preserved even if deletion succeeds
    // but subsequent operations fail. This prevents unrecoverable data loss.
    await this.historyRepository.recordHistory({
      action: "deleted",
      actor: this.actor,
      projectName,
      fileName,
      content,
    });

    // Delete the file using wrapped repository
    // If this fails, we have a history record but file still exists - minor inconsistency
    // but far better than losing the file without history
    const deleted = await this.wrappedRepository.deleteFile(projectName, fileName);

    return deleted;
  }
}
