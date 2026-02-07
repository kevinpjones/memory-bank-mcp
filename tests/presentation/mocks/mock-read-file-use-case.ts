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
}

export const makeReadFileUseCase = (): ReadFileUseCase => {
  return new MockReadFileUseCase();
};
