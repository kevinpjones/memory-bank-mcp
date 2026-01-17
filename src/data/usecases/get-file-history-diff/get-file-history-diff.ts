import { createTwoFilesPatch } from "diff";
import {
  GetFileHistoryDiffParams,
  GetFileHistoryDiffResult,
  GetFileHistoryDiffUseCase,
  HistoryRepository,
  FileRepository,
} from "./get-file-history-diff-protocols.js";

/**
 * Generates unified diff output between two versions of a file
 * Uses the 'diff' library for robust unified diff generation
 */
export class GetFileHistoryDiff implements GetFileHistoryDiffUseCase {
  constructor(
    private readonly historyRepository: HistoryRepository,
    private readonly fileRepository: FileRepository
  ) {}

  async getFileHistoryDiff(
    params: GetFileHistoryDiffParams
  ): Promise<GetFileHistoryDiffResult | null> {
    const { projectName, fileName, versionFrom, versionTo } = params;

    // Get content for versionFrom
    const contentFrom = await this.historyRepository.getFileByVersion(
      projectName,
      fileName,
      versionFrom
    );

    if (contentFrom === null) {
      return null;
    }

    // Get content for versionTo (or current version if not specified)
    let contentTo: string | null;
    let actualVersionTo: number;

    if (versionTo !== undefined) {
      contentTo = await this.historyRepository.getFileByVersion(
        projectName,
        fileName,
        versionTo
      );
      actualVersionTo = versionTo;
    } else {
      // Get current file content
      contentTo = await this.fileRepository.loadFile(projectName, fileName);
      // Determine the latest version number
      const history = await this.historyRepository.getFileHistory(projectName, fileName);
      if (history.length === 0) {
        return null;
      }
      actualVersionTo = Math.max(...history.map((e) => e.version ?? 0));
      // If current content matches latest history, use that version
      // Otherwise, treat as "current" which is latest + 1 conceptually
      const latestHistoryContent = await this.historyRepository.getFileByVersion(
        projectName,
        fileName,
        actualVersionTo
      );
      if (contentTo !== latestHistoryContent) {
        // Current file differs from latest history - use "current" indicator
        actualVersionTo = actualVersionTo + 1;
      }
    }

    if (contentTo === null) {
      return null;
    }

    // Generate unified diff using the 'diff' library
    const diff = createTwoFilesPatch(
      `${fileName} (version ${versionFrom})`,
      `${fileName} (version ${actualVersionTo})`,
      contentFrom,
      contentTo,
      undefined, // oldHeader
      undefined, // newHeader
      { context: 3 } // 3 lines of context (standard unified diff)
    );

    return {
      diff,
      versionFrom,
      versionTo: actualVersionTo,
      fileName,
    };
  }
}
