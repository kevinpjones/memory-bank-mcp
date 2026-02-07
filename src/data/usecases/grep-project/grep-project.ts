import { searchLines } from "../grep-file/grep-file.js";
import {
  FileRepository,
  GrepProjectFileResult,
  GrepProjectParams,
  GrepProjectResult,
  GrepProjectUseCase,
  ProjectRepository,
} from "./grep-project-protocols.js";

export class GrepProject implements GrepProjectUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async grepProject(
    params: GrepProjectParams
  ): Promise<GrepProjectResult | null> {
    const {
      projectName,
      pattern,
      contextLines = 2,
      caseSensitive = true,
      maxResults = 100,
    } = params;

    const projectExists = await this.projectRepository.projectExists(
      projectName
    );
    if (!projectExists) {
      return null;
    }

    const files = await this.fileRepository.listFiles(projectName);

    const results: GrepProjectFileResult[] = [];
    let totalMatches = 0;
    let truncated = false;

    for (const fileName of files) {
      if (totalMatches >= maxResults) {
        truncated = true;
        break;
      }

      const lines = await this.fileRepository.loadFileLines(
        projectName,
        fileName
      );
      if (lines === null) {
        continue;
      }

      const matches = searchLines(lines, pattern, contextLines, caseSensitive);

      if (matches.length === 0) {
        continue;
      }

      // Check if adding all matches would exceed maxResults
      const remaining = maxResults - totalMatches;
      if (matches.length > remaining) {
        truncated = true;
        results.push({
          file_path: fileName,
          matches: matches.slice(0, remaining),
        });
        totalMatches += remaining;
        break;
      }

      results.push({
        file_path: fileName,
        matches,
      });
      totalMatches += matches.length;
    }

    return {
      results,
      total_matches: totalMatches,
      truncated,
    };
  }
}
