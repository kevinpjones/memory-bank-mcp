import {
  FileRepository,
  ProjectRepository,
  PatchFileParams,
  PatchFileResult,
  PatchFileUseCase,
} from "./patch-file-protocols.js";
import {
  normalizeLineEndings,
  normalizeForComparison,
} from "../../helpers/index.js";
import {
  stripLineNumbers,
  hasLineNumbers,
} from "../../../presentation/helpers/line-numbers.js";

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

    // Normalize line endings in the file content to handle cross-platform differences
    // This ensures CRLF (Windows), CR (old Mac), and LF (Unix) are all treated consistently
    const normalizedFileContent = normalizeLineEndings(currentContent);

    // Split normalized content into lines
    const lines = normalizedFileContent.split("\n");
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

    // Strip line number prefixes from oldContent and newContent if present
    // This allows agents to copy content directly from memory_bank_read responses
    // (which include line numbers by default) without manual stripping
    const strippedOldContent = hasLineNumbers(oldContent)
      ? stripLineNumbers(oldContent)
      : oldContent;
    const strippedNewContent = hasLineNumbers(newContent)
      ? stripLineNumbers(newContent)
      : newContent;

    // Normalize both contents for comparison:
    // - Normalizes line endings (CRLF, CR -> LF)
    // - Trims a single trailing newline for flexibility
    // This eliminates false negatives from line ending differences while
    // still maintaining security by requiring exact content match
    const normalizedOldContent = normalizeForComparison(strippedOldContent);
    const normalizedExtractedContent = normalizeForComparison(extractedContent);

    // Verify content matches
    if (normalizedExtractedContent !== normalizedOldContent) {
      return {
        success: false,
        error: "CONTENT_MISMATCH",
        errorContext: { actualContent: extractedContent },
      };
    }

    // Apply the patch: replace the specified line range with new content
    // Use stripped content (without line number prefixes) for the actual file update
    const newContentLines = strippedNewContent.split("\n");
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
