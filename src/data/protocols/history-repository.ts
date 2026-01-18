import {
  HistoryEntry,
  RecordHistoryParams,
  ProjectStateAtTime,
} from "../../domain/entities/index.js";
import { HistoryEntryMetadata } from "../../domain/usecases/get-file-history.js";

/**
 * Repository interface for Memory Bank file history tracking
 * Provides operations for recording and querying file change history
 */
export interface HistoryRepository {
  /**
   * Records a history entry for a file change
   * @param params The history entry parameters
   */
  recordHistory(params: RecordHistoryParams): Promise<void>;

  /**
   * Gets the history for a specific file
   * @param projectName The name of the project
   * @param fileName The name of the file
   * @returns Array of history entries for the file, sorted by timestamp ascending
   */
  getFileHistory(projectName: string, fileName: string): Promise<HistoryEntry[]>;

  /**
   * Gets the history for all files in a project
   * @param projectName The name of the project
   * @returns Array of history entries for all files in the project, sorted by timestamp ascending
   */
  getProjectHistory(projectName: string): Promise<HistoryEntry[]>;

  /**
   * Gets the history metadata (without content) for all files in a project
   * @param projectName The name of the project
   * @returns Array of history entry metadata, sorted by timestamp ascending
   */
  getProjectHistoryMetadata(projectName: string): Promise<HistoryEntryMetadata[]>;

  /**
   * Gets the content of a specific file at a specific point in time
   * @param projectName The name of the project
   * @param fileName The name of the file
   * @param timestamp ISO 8601 timestamp to get the file content at
   * @returns The file content at the specified time, or null if file didn't exist
   */
  getFileAtTime(projectName: string, fileName: string, timestamp: string): Promise<string | null>;

  /**
   * Reconstructs the complete project state at a specific point in time
   * @param projectName The name of the project
   * @param timestamp ISO 8601 timestamp to reconstruct state at
   * @returns The project state at the specified time
   */
  getStateAtTime(projectName: string, timestamp: string): Promise<ProjectStateAtTime>;

  /**
   * Gets the content of a specific file at a specific version
   * @param projectName The name of the project
   * @param fileName The name of the file
   * @param version The version number to retrieve (1-based)
   * @returns The file content at the specified version, or null if version doesn't exist
   */
  getFileByVersion(projectName: string, fileName: string, version: number): Promise<string | null>;
}
