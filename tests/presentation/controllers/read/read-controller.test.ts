import { describe, expect, it, vi } from "vitest";
import { ReadRequest } from "../../../../src/presentation/controllers/read/protocols.js";
import { ReadController } from "../../../../src/presentation/controllers/read/read-controller.js";
import {
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

  it("should call ReadFileUseCase with correct values", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    const readFileSpy = vi.spyOn(readFileUseCaseStub, "readFile");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
      },
    };
    await sut.handle(request);
    expect(readFileSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      fileName: "any_file",
    });
  });

  it("should return 404 if ReadFileUseCase returns null", async () => {
    const { sut, readFileUseCaseStub } = makeSut();
    vi.spyOn(readFileUseCaseStub, "readFile").mockResolvedValueOnce(null);
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
    vi.spyOn(readFileUseCaseStub, "readFile").mockRejectedValueOnce(
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
    vi.spyOn(readFileUseCaseStub, "readFile").mockResolvedValueOnce(
      "first line\nsecond line\nthird line"
    );
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
    vi.spyOn(readFileUseCaseStub, "readFile").mockResolvedValueOnce(
      "first\n\nthird"
    );
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
    vi.spyOn(readFileUseCaseStub, "readFile").mockResolvedValueOnce(
      lines.join("\n")
    );
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
});
