import {
  HistoryEntry,
  RecordHistoryParams,
  ProjectStateAtTime,
} from "../../domain/entities/index.js";

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
   * Reconstructs the complete project state at a specific point in time
   * @param projectName The name of the project
   * @param timestamp ISO 8601 timestamp to reconstruct state at
   * @returns The project state at the specified time
   */
  getStateAtTime(projectName: string, timestamp: string): Promise<ProjectStateAtTime>;
}
