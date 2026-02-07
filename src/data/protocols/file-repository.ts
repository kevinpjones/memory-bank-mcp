import { File } from "../../domain/entities/index.js";

export interface FileRepository {
  listFiles(projectName: string): Promise<File[]>;
  loadFile(projectName: string, fileName: string): Promise<File | null>;
  /**
   * Loads a file and returns its content split into lines using readline.
   * Handles all line ending styles (LF, CRLF, CR) consistently.
   * @returns Array of lines, or null if file doesn't exist
   */
  loadFileLines(
    projectName: string,
    fileName: string
  ): Promise<string[] | null>;
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
