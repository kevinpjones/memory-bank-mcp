import {
  FileRepository,
  GrepFileParams,
  GrepFileResult,
  GrepFileUseCase,
  GrepMatch,
  ProjectRepository,
} from "./grep-file-protocols.js";

export class GrepFile implements GrepFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async grepFile(params: GrepFileParams): Promise<GrepFileResult | null> {
    const {
      projectName,
      fileName,
      pattern,
      contextLines = 2,
      caseSensitive = true,
    } = params;

    const projectExists = await this.projectRepository.projectExists(
      projectName
    );
    if (!projectExists) {
      return null;
    }

    const lines = await this.fileRepository.loadFileLines(
      projectName,
      fileName
    );
    if (lines === null) {
      return null;
    }

    const matches = searchLines(lines, pattern, contextLines, caseSensitive);

    return {
      file_path: fileName,
      matches,
    };
  }
}

/**
 * Searches through lines for a pattern and returns matches with context.
 */
export function searchLines(
  lines: string[],
  pattern: string,
  contextLines: number,
  caseSensitive: boolean
): GrepMatch[] {
  if (lines.length === 0 || pattern === "") {
    return [];
  }

  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

  // Find all matching line indices (0-based)
  const matchingIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineToSearch = caseSensitive ? lines[i] : lines[i].toLowerCase();
    if (lineToSearch.includes(searchPattern)) {
      matchingIndices.push(i);
    }
  }

  if (matchingIndices.length === 0) {
    return [];
  }

  // Build matches with context
  const matches: GrepMatch[] = [];

  for (const idx of matchingIndices) {
    const contextStart = Math.max(0, idx - contextLines);
    const contextEnd = Math.min(lines.length - 1, idx + contextLines);

    const contextContent = lines
      .slice(contextStart, contextEnd + 1)
      .join("\n");

    matches.push({
      match_line: idx + 1, // 1-indexed
      line_start: contextStart + 1, // 1-indexed
      line_end: contextEnd + 1, // 1-indexed
      content: contextContent,
    });
  }

  return matches;
}
