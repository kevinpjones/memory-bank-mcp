import {
  GrepProjectUseCase,
  GrepProjectParams,
  GrepProjectResult,
} from "../../../src/domain/usecases/grep-project.js";

export class MockGrepProjectUseCase implements GrepProjectUseCase {
  async grepProject(
    params: GrepProjectParams
  ): Promise<GrepProjectResult | null> {
    return {
      results: [
        {
          file_path: "file1.md",
          matches: [
            {
              match_line: 2,
              line_start: 1,
              line_end: 4,
              content: "line 1\nmatched line\nline 3\nline 4",
            },
          ],
        },
      ],
      total_matches: 1,
      truncated: false,
    };
  }
}

export const makeGrepProjectUseCase = (): GrepProjectUseCase => {
  return new MockGrepProjectUseCase();
};
