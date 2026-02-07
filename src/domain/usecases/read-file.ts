import { File } from "../entities/index.js";
export interface ReadFileParams {
  projectName: string;
  fileName: string;
}

export interface ReadFilePreviewParams {
  projectName: string;
  fileName: string;
  maxLines: number;
}

export interface ReadFilePreviewResult {
  content: string;
  totalLines: number;
}

export interface ReadFileUseCase {
  readFile(params: ReadFileParams): Promise<File | null>;
  /**
   * Reads only the first maxLines from a file. Efficient for large files.
   */
  readFilePreview(
    params: ReadFilePreviewParams
  ): Promise<ReadFilePreviewResult | null>;
}
