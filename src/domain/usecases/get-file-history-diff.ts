/**
 * Domain interface for generating unified diff between file versions
 */

export interface GetFileHistoryDiffParams {
  /** Name of the project */
  projectName: string;
  /** Name of the file to diff */
  fileName: string;
  /** Source version number (1-based) */
  versionFrom: number;
  /** Target version number (1-based, optional - defaults to current/latest version) */
  versionTo?: number;
}

export interface GetFileHistoryDiffResult {
  /** The unified diff output */
  diff: string;
  /** Source version number */
  versionFrom: number;
  /** Target version number */
  versionTo: number;
  /** File name being diffed */
  fileName: string;
}

export interface GetFileHistoryDiffUseCase {
  /**
   * Generates a unified diff between two versions of a file
   * @param params The diff parameters
   * @returns The diff result, or null if versions don't exist
   */
  getFileHistoryDiff(params: GetFileHistoryDiffParams): Promise<GetFileHistoryDiffResult | null>;
}
