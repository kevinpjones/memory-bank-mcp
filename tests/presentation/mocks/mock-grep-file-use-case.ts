import {
  GrepFileUseCase,
  GrepFileParams,
  GrepFileResult,
} from "../../../src/domain/usecases/grep-file.js";

export class MockGrepFileUseCase implements GrepFileUseCase {
  async grepFile(params: GrepFileParams): Promise<GrepFileResult | null> {
    return {
      file_path: params.fileName,
      matches: [
        {
          match_line: 2,
          line_start: 1,
          line_end: 4,
          content: "line 1\nmatched line\nline 3\nline 4",
        },
      ],
    };
  }
}

export const makeGrepFileUseCase = (): GrepFileUseCase => {
  return new MockGrepFileUseCase();
};
