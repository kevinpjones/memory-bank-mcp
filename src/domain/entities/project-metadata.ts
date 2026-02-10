/**
 * Metadata stored in .metadata.json within each project directory.
 */
export interface ProjectMetadata {
  /** The original user-provided project name (may contain spaces, special chars) */
  friendlyName: string;
  /** The normalized filesystem-safe directory name */
  directoryName: string;
  /** ISO 8601 timestamp of when the project was first created */
  createdAt: string;
}

/**
 * Enriched project info returned by list_projects with friendly name support.
 */
export interface ProjectInfo {
  /** The filesystem directory name (primary identifier) */
  name: string;
  /** The human-friendly display name */
  friendlyName: string;
}
