/**
 * Domain entities for Memory Bank file history tracking
 * Enables point-in-time reconstruction of project state
 */

/**
 * Action types for history entries
 */
export type HistoryAction = "created" | "modified" | "deleted";

/**
 * A history entry representing a single change to a Memory Bank file
 */
export interface HistoryEntry {
  /** Sequential version number for this file (1-based, increments with each change) */
  version: number;
  /** ISO 8601 timestamp of when the change occurred */
  timestamp: string;
  /** Type of action performed */
  action: HistoryAction;
  /** Source/actor that made the change (e.g., "mcp-server", "web-ui") */
  actor: string;
  /** Name of the project containing the file */
  projectName: string;
  /** Name of the file that was changed */
  fileName: string;
  /** File content at this point in time (null for deleted files) */
  content: string | null;
}

/**
 * Parameters for recording a history entry
 */
export interface RecordHistoryParams {
  /** Type of action performed */
  action: HistoryAction;
  /** Source/actor that made the change */
  actor: string;
  /** Name of the project */
  projectName: string;
  /** Name of the file */
  fileName: string;
  /** File content (null for deleted files) */
  content: string | null;
}

/**
 * Parameters for querying history
 */
export interface GetHistoryParams {
  /** Name of the project */
  projectName: string;
  /** Optional: specific file name to get history for */
  fileName?: string;
}

/**
 * Parameters for time-travel state reconstruction
 */
export interface GetStateAtTimeParams {
  /** Name of the project */
  projectName: string;
  /** ISO 8601 timestamp to reconstruct state at */
  timestamp: string;
}

/**
 * Result of time-travel state reconstruction
 * Maps file names to their content at the specified time
 */
export interface ProjectStateAtTime {
  /** The timestamp the state was reconstructed for */
  timestamp: string;
  /** Map of file names to their content (files that existed at that time) */
  files: Map<string, string>;
}
