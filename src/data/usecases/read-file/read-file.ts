import {
  FileRepository,
  ProjectRepository,
  ReadFileParams,
  ReadFilePartialParams,
  ReadFilePreviewParams,
  ReadFileUseCase,
} from "./read-file-protocols.js";

export class ReadFile implements ReadFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async readFile(params: ReadFileParams): Promise<string | null> {
    const { projectName, fileName } = params;

    const projectExists = await this.projectRepository.projectExists(
      projectName
    );
    if (!projectExists) {
      return null;
    }

    return this.fileRepository.loadFile(projectName, fileName);
  }

  async readFilePreview(
    params: ReadFilePreviewParams
  ): Promise<{ content: string; totalLines: number } | null> {
    const { projectName, fileName, maxLines } = params;

    const lines = await this.loadLines(projectName, fileName);
    if (lines === null) {
      return null;
    }

    const totalLines = lines.length;
    const content = lines.slice(0, maxLines).join("\n");

    return { content, totalLines };
  }

  async readFilePartial(
    params: ReadFilePartialParams
  ): Promise<{ content: string; totalLines: number; startLine: number } | null> {
    const { projectName, fileName } = params;

    const lines = await this.loadLines(projectName, fileName);
    if (lines === null) {
      return null;
    }

    const totalLines = lines.length;

    // Resolve effective start and end (1-based, inclusive)
    let effectiveStart = params.startLine ?? 1;
    let effectiveEnd = params.endLine ?? totalLines;

    // Apply maxLines constraint
    if (params.maxLines !== undefined) {
      const maxEnd = effectiveStart + params.maxLines - 1;
      effectiveEnd = Math.min(effectiveEnd, maxEnd);
    }

    // Validate resolved range against file bounds
    if (effectiveStart > totalLines) {
      throw new RangeError(
        `startLine (${effectiveStart}) exceeds total lines in file (${totalLines})`
      );
    }

    // Clamp effectiveEnd to file bounds (graceful handling)
    effectiveEnd = Math.min(effectiveEnd, totalLines);

    // Slice lines (convert 1-based to 0-based)
    const slicedLines = lines.slice(effectiveStart - 1, effectiveEnd);

    return {
      content: slicedLines.join("\n"),
      totalLines,
      startLine: effectiveStart,
    };
  }

  /**
   * Shared helper: checks project exists and loads file lines via readline.
   */
  private async loadLines(
    projectName: string,
    fileName: string
  ): Promise<string[] | null> {
    const projectExists = await this.projectRepository.projectExists(
      projectName
    );
    if (!projectExists) {
      return null;
    }

    return this.fileRepository.loadFileLines(projectName, fileName);
  }
}
