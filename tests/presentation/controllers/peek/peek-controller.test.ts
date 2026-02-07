import { describe, expect, it, vi } from "vitest";
import { PeekFileRequest, PeekFileResponse } from "../../../../src/presentation/controllers/peek/protocols.js";
import { PeekController } from "../../../../src/presentation/controllers/peek/peek-controller.js";
import {
  InvalidParamError,
  NotFoundError,
  UnexpectedError,
} from "../../../../src/presentation/errors/index.js";
import { makeReadFileUseCase, makeValidator } from "../../mocks/index.js";

const makeSut = () => {
  const validatorStub = makeValidator<PeekFileRequest>();
  const readFileUseCaseStub = makeReadFileUseCase();
  const sut = new PeekController(readFileUseCaseStub, validatorStub);
  return {
    sut,
    validatorStub,
    readFileUseCaseStub,
  };
};

const makeMultiLineContent = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join("\n");

describe("PeekController", () => {
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

  it("should return 404 if ReadFileUseCase returns null", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce(null);
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
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockRejectedValueOnce(
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

  it("should return first 10 lines by default", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const content = makeMultiLineContent(50);
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: content.split("\n").slice(0, 10).join("\n"),
      totalLines: 50,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(50);
    expect(body.fileName).toBe("any_file");
    expect(body.previewLineCount).toBe(10);
    const previewLines = body.preview.split("\n");
    expect(previewLines.length).toBe(10);
    expect(previewLines[0]).toBe(" 1|line 1");
    expect(previewLines[9]).toBe("10|line 10");
  });

  it("should respect custom previewLines parameter", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const content = makeMultiLineContent(100);
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: content.split("\n").slice(0, 25).join("\n"),
      totalLines: 100,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: 25,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(100);
    expect(body.previewLineCount).toBe(25);
    const previewLines = body.preview.split("\n");
    expect(previewLines.length).toBe(25);
  });

  it("should handle files shorter than preview length gracefully", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const content = makeMultiLineContent(3);
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content,
      totalLines: 3,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: 10,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(3);
    expect(body.previewLineCount).toBe(3);
    const previewLines = body.preview.split("\n");
    expect(previewLines.length).toBe(3);
  });

  it("should handle single-line files", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: "only line",
      totalLines: 1,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(1);
    expect(body.previewLineCount).toBe(1);
    expect(body.preview).toBe("1|only line");
  });

  it("should handle empty files correctly", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: "",
      totalLines: 0,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(0);
    expect(body.previewLineCount).toBe(0);
    expect(body.preview).toBe("");
  });

  it("should correctly report total line count for large files", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const content = makeMultiLineContent(1000);
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: content.split("\n").slice(0, 10).join("\n"),
      totalLines: 1000,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    expect(body.totalLines).toBe(1000);
    expect(body.previewLineCount).toBe(10);
    // Padding should account for 4-digit line numbers
    const previewLines = body.preview.split("\n");
    expect(previewLines[0]).toBe("   1|line 1");
    expect(previewLines[9]).toBe("  10|line 10");
  });

  it("should return 400 for previewLines = 0", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: 0,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(InvalidParamError);
  });

  it("should return 400 for negative previewLines", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: -5,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(InvalidParamError);
  });

  it("should return 400 for non-integer previewLines", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: 3.7,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(InvalidParamError);
  });

  it("should use correct line number padding based on total file lines", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const content = makeMultiLineContent(200);
    vi.spyOn(readFileUseCaseStub, "readFilePreview").mockResolvedValueOnce({
      content: content.split("\n").slice(0, 3).join("\n"),
      totalLines: 200,
    });
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        previewLines: 3,
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    const body = response.body as PeekFileResponse;
    // File has 200 lines, so padding width is 3
    const previewLines = body.preview.split("\n");
    expect(previewLines[0]).toBe("  1|line 1");
    expect(previewLines[2]).toBe("  3|line 3");
  });
});
