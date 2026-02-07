import { describe, expect, it, vi } from "vitest";
import { ReadRequest } from "../../../../src/presentation/controllers/read/protocols.js";
import { ReadController } from "../../../../src/presentation/controllers/read/read-controller.js";
import {
  InvalidParamError,
  NotFoundError,
  UnexpectedError,
} from "../../../../src/presentation/errors/index.js";
import { makeReadFileUseCase, makeValidator } from "../../mocks/index.js";

const makeSut = () => {
  const validatorStub = makeValidator<ReadRequest>();
  const readFileUseCaseStub = makeReadFileUseCase();
  const sut = new ReadController(readFileUseCaseStub, validatorStub);
  return {
    sut,
    validatorStub,
    readFileUseCaseStub,
  };
};

// Helper to create multi-line content for partial read tests
const makeMultiLineContent = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join("\n");

describe("ReadController", () => {
  it("should call validator with correct values", async () => {
    const { sut, validatorStub } = makeSut();
    const validateSpy = vi.spyOn(validatorStub, "validate");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    await sut.handle(request);
    expect(validateSpy).toHaveBeenCalledWith(request.body);
  });

  it("should return 400 if validator returns an error", async () => {
    const { sut, validatorStub } = makeSut();
    vi.spyOn(validatorStub, "validate").mockReturnValueOnce(
      new Error("any_error")
    );
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response).toEqual({
      statusCode: 400,
      body: new Error("any_error"),
    });
  });

  it("should call ReadFileUseCase.readFilePartial with correct values", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const readFilePartialSpy = vi.spyOn(readFileUseCaseStub, "readFilePartial");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    await sut.handle(request);
    expect(readFilePartialSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      fileName: "any_file",
      startLine: undefined,
      endLine: undefined,
      maxLines: undefined,
    });
  });

  it("should return 404 if ReadFileUseCase returns null", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePartial").mockResolvedValueOnce(null);
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response).toEqual({
      statusCode: 404,
      body: new NotFoundError("any_file"),
    });
  });

  it("should return 500 if ReadFileUseCase throws", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePartial").mockRejectedValueOnce(
      new Error("any_error")
    );
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response).toEqual({
      statusCode: 500,
      body: new UnexpectedError(new Error("any_error")),
    });
  });

  it("should return 200 with line numbers by default", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    // Default mock returns "file content" which becomes "1|file content"
    expect(response.body).toBe("1|file content");
  });

  it("should return 200 with line numbers when includeLineNumbers is true", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        includeLineNumbers: true,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("1|file content");
  });

  it("should return 200 without line numbers when includeLineNumbers is false", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        includeLineNumbers: false,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    // Should return raw content without line numbers
    expect(response.body).toBe("file content");
  });

  it("should add sequential 1-indexed line numbers to multi-line content", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePartial").mockResolvedValueOnce({
      content: "first line\nsecond line\nthird line",
      totalLines: 3,
      startLine: 1,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        includeLineNumbers: true,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("1|first line\n2|second line\n3|third line");
  });

  it("should preserve empty lines when adding line numbers", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePartial").mockResolvedValueOnce({
      content: "first\n\nthird",
      totalLines: 3,
      startLine: 1,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        includeLineNumbers: true,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("1|first\n2|\n3|third");
  });

  it("should handle large files with proper line number padding", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
    vi.spyOn(readFileUseCaseStub, "readFilePartial").mockResolvedValueOnce({
      content: lines.join("\n"),
      totalLines: 100,
      startLine: 1,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        includeLineNumbers: true,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const resultLines = (response.body as string).split("\n");
    // First line should be padded
    expect(resultLines[0]).toBe("  1|line 1");
    // Line 100 should not be padded
    expect(resultLines[99]).toBe("100|line 100");
  });

  // ============================================================
  // Partial file reading tests
  // ============================================================

  describe("partial file reading", () => {
    // Helper: mock readFilePartial with a multi-line file
    const mockPartial = (stub: any, totalLines: number) => {
      const allLines = Array.from({ length: totalLines }, (_, i) => `line ${i + 1}`);
      vi.spyOn(stub, "readFilePartial").mockImplementation(async (params: any) => {
        const effectiveStart = params.startLine ?? 1;
        let effectiveEnd = params.endLine ?? totalLines;
        if (params.maxLines !== undefined) {
          effectiveEnd = Math.min(effectiveEnd, effectiveStart + params.maxLines - 1);
        }
        effectiveEnd = Math.min(effectiveEnd, totalLines);
        const sliced = allLines.slice(effectiveStart - 1, effectiveEnd);
        return { content: sliced.join("\n"), totalLines, startLine: effectiveStart };
      });
    };

    it("should return entire file when no line params are specified (backward compatible)", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 5);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("1|line 1\n2|line 2\n3|line 3\n4|line 4\n5|line 5");
    });

    it("should return lines 50-100 when startLine=50 and endLine=100", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 200);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 50,
          endLine: 100,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(51); // 50 to 100 inclusive
      expect(resultLines[0]).toBe(" 50|line 50");
      expect(resultLines[50]).toBe("100|line 100");
    });

    it("should return from startLine to end of file when only startLine specified", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 10);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 8,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(3); // lines 8, 9, 10
      expect(resultLines[0]).toBe(" 8|line 8");
      expect(resultLines[2]).toBe("10|line 10");
    });

    it("should return from beginning to endLine when only endLine specified", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 10);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          endLine: 3,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(3); // lines 1, 2, 3
      expect(resultLines[0]).toBe(" 1|line 1");
      expect(resultLines[2]).toBe(" 3|line 3");
    });

    it("should return exactly maxLines starting from startLine", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 100);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 50,
          maxLines: 20,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(20);
      expect(resultLines[0]).toBe(" 50|line 50");
      expect(resultLines[19]).toBe(" 69|line 69");
    });

    it("should return first maxLines when only maxLines specified", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 50);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          maxLines: 5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(5);
      expect(resultLines[0]).toBe(" 1|line 1");
      expect(resultLines[4]).toBe(" 5|line 5");
    });

    it("should respect endLine when maxLines would extend beyond it", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 100);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 10,
          endLine: 15,
          maxLines: 50,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(6); // endLine constrains it to 10-15
    });

    it("should respect maxLines when endLine would extend beyond it", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 100);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 10,
          endLine: 50,
          maxLines: 5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(5); // maxLines constrains it to 10-14
    });

    it("should return partial content without line numbers when includeLineNumbers is false", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 10);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 3,
          endLine: 5,
          includeLineNumbers: false,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("line 3\nline 4\nline 5");
    });

    it("should use correct padding based on total file lines for partial reads", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 200);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 1,
          endLine: 3,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      // File has 200 lines, so padding should be 3 digits
      const resultLines = (response.body as string).split("\n");
      expect(resultLines[0]).toBe("  1|line 1");
      expect(resultLines[2]).toBe("  3|line 3");
    });

    it("should clamp endLine to file bounds gracefully", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      mockPartial(readFileUseCaseStub, 5);
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 3,
          endLine: 999,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
      const resultLines = (response.body as string).split("\n");
      expect(resultLines.length).toBe(3); // lines 3, 4, 5
    });
  });

  // ============================================================
  // Parameter validation tests
  // ============================================================

  describe("line parameter validation", () => {
    it("should return 400 for startLine = 0", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for negative startLine", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: -5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for non-integer startLine", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 2.5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for endLine = 0", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          endLine: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for negative endLine", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          endLine: -1,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for maxLines = 0", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          maxLines: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for negative maxLines", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          maxLines: -10,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 when startLine > endLine", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 50,
          endLine: 10,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 when startLine exceeds total file lines", async () => {
      const { sut, readFileUseCaseStub } = makeSut();
      vi.spyOn(readFileUseCaseStub, "readFilePartial").mockRejectedValueOnce(
        new RangeError("startLine (100) exceeds total lines in file (5)")
      );
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          startLine: 100,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });
  });
});
