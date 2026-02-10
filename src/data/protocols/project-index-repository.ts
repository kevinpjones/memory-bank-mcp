/**
 * Repository for managing the global project name index (.index file).
 * Maps friendly project names to filesystem directory names.
 */
export interface ProjectIndexRepository {
  /**
   * Looks up a directory name by friendly name.
   * @returns The directory name, or null if no mapping exists.
   */
  getDirectoryName(friendlyName: string): Promise<string | null>;

  /**
   * Stores a mapping from friendly name to directory name.
   */
  setMapping(friendlyName: string, directoryName: string): Promise<void>;

  /**
   * Removes a mapping by friendly name.
   */
  removeMapping(friendlyName: string): Promise<void>;

  /**
   * Returns all mappings as a Record<friendlyName, directoryName>.
   */
  getAllMappings(): Promise<Record<string, string>>;

  /**
   * Replaces the entire index with the provided entries.
   * Used for index regeneration / recovery.
   */
  rebuildIndex(
    entries: Array<{ friendlyName: string; directoryName: string }>
  ): Promise<void>;
}
