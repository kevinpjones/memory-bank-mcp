import {
  FileRepository,
  ProjectRepository,
  PatchFileParams,
  PatchFileResult,
  PatchFileUseCase,
} from "./patch-file-protocols.js";

export class PatchFile implements PatchFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async patchFile(params: PatchFileParams): Promise<PatchFileResult> {
    const { projectName, fileName, oldContent, newContent } = params;
    // Ensure line numbers are integers (defense in depth)
    const startLine = Math.floor(params.startLine);
    const endLine = Math.floor(params.endLine);

    // Check if project exists
    const projectExists = await this.projectRepository.projectExists(projectName);
    if (!projectExists) {
      return { success: false, error: "PROJECT_NOT_FOUND" };
    }

    // Check if file exists and get current content
    const currentContent = await this.fileRepository.loadFile(projectName, fileName);
    if (currentContent === null) {
      return { success: false, error: "FILE_NOT_FOUND" };
    }

    // Split content into lines
    const lines = currentContent.split("\n");
    const totalLines = lines.length;

    // Validate line range (1-based indexing)
    // Note: NaN comparisons always return false, so we must check explicitly
    if (
      Number.isNaN(startLine) ||
      Number.isNaN(endLine) ||
      startLine < 1 ||
      endLine < startLine ||
      endLine > totalLines
    ) {
      return {
        success: false,
        error: "INVALID_LINE_RANGE",
        errorContext: { totalLines },
      };
    }

    // Extract the content at the specified line range (convert to 0-based)
    const extractedLines = lines.slice(startLine - 1, endLine);
    const extractedContent = extractedLines.join("\n");

    // Normalize content for comparison (trim at most one trailing newline for flexibility)
    // Using /\n$/ instead of /\n+$/ to preserve distinction between empty lines
    const normalizedOldContent = oldContent.replace(/\n$/, "");
    const normalizedExtractedContent = extractedContent.replace(/\n$/, "");

    // Verify content matches
    if (normalizedExtractedContent !== normalizedOldContent) {
      return {
        success: false,
        error: "CONTENT_MISMATCH",
        errorContext: { actualContent: extractedContent },
      };
    }

    // Apply the patch: replace the specified line range with new content
    const newContentLines = newContent.split("\n");
    const newLines = [
      ...lines.slice(0, startLine - 1),
      ...newContentLines,
      ...lines.slice(endLine),
    ];
    const finalContent = newLines.join("\n");

    // Update the file atomically
    const result = await this.fileRepository.updateFile(
      projectName,
      fileName,
      finalContent
    );

    if (result === null) {
      return { success: false, error: "FILE_NOT_FOUND" };
    }

    return { success: true, content: result };
  }
}
