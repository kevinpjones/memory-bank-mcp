import { ReadFileUseCase } from "../../../src/domain/usecases/read-file.js";
import { ReadRequest } from "../../../src/presentation/controllers/read/protocols.js";

export class MockReadFileUseCase implements ReadFileUseCase {
  async readFile(params: ReadRequest): Promise<string | null> {
    return "file content";
  }

  async readFilePreview(params: {
    projectName: string;
    fileName: string;
    maxLines: number;
  }): Promise<{ content: string; totalLines: number } | null> {
    const content = "file content";
    const lines = content.split("\n");
    return {
      content: lines.slice(0, params.maxLines).join("\n"),
      totalLines: lines.length,
    };
  }

  async readFilePartial(params: {
    projectName: string;
    fileName: string;
    startLine?: number;
    endLine?: number;
    maxLines?: number;
  }): Promise<{ content: string; totalLines: number; startLine: number } | null> {
    const content = "file content";
    const lines = content.split("\n");
    const totalLines = lines.length;
    const effectiveStart = params.startLine ?? 1;
    let effectiveEnd = params.endLine ?? totalLines;
    if (params.maxLines !== undefined) {
      effectiveEnd = Math.min(effectiveEnd, effectiveStart + params.maxLines - 1);
    }
    effectiveEnd = Math.min(effectiveEnd, totalLines);
    const sliced = lines.slice(effectiveStart - 1, effectiveEnd);
    return {
      content: sliced.join("\n"),
      totalLines,
      startLine: effectiveStart,
    };
  }
}

export const makeReadFileUseCase = (): ReadFileUseCase => {
  return new MockReadFileUseCase();
};
