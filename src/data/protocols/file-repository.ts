import { File } from "../../domain/entities/index.js";

export interface FilePreviewResult {
  content: string;
  totalLines: number;
}

export interface FileRepository {
  listFiles(projectName: string): Promise<File[]>;
  loadFile(projectName: string, fileName: string): Promise<File | null>;
  /**
   * Loads only the first maxLines from a file. Efficient for large files.
   * @param maxLines Maximum number of lines to read from the start
   * @returns content (first N lines) and totalLines, or null if file doesn't exist
   */
  loadFilePreview(
    projectName: string,
    fileName: string,
    maxLines: number
  ): Promise<FilePreviewResult | null>;
  writeFile(
    projectName: string,
    fileName: string,
    content: string
  ): Promise<File | null>;
  updateFile(
    projectName: string,
    fileName: string,
    content: string
  ): Promise<File | null>;
  deleteFile(
    projectName: string,
    fileName: string
  ): Promise<boolean>;
}
