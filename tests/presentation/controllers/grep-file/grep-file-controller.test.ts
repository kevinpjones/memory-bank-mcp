import { describe, expect, it, vi } from "vitest";
import { GrepFileRequest } from "../../../../src/presentation/controllers/grep-file/protocols.js";
import { GrepFileController } from "../../../../src/presentation/controllers/grep-file/grep-file-controller.js";
import {
  InvalidParamError,
  MissingParamError,
  NotFoundError,
  UnexpectedError,
} from "../../../../src/presentation/errors/index.js";
import { makeGrepFileUseCase, makeValidator } from "../../mocks/index.js";

const makeSut = () => {
  const validatorStub = makeValidator<GrepFileRequest>();
  const grepFileUseCaseStub = makeGrepFileUseCase();
  const sut = new GrepFileController(grepFileUseCaseStub, validatorStub);
  return {
    sut,
    validatorStub,
    grepFileUseCaseStub,
  };
};

describe("GrepFileController", () => {
  it("should call validator with correct values", async () => {
    const { sut, validatorStub } = makeSut();
    const validateSpy = vi.spyOn(validatorStub, "validate");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search term",
      },
    };
    await sut.handle(request);
    expect(validateSpy).toHaveBeenCalledWith(request.body);
  });

  it("should return 400 if validator returns an error", async () => {
    const { sut, validatorStub } = makeSut();
    vi.spyOn(validatorStub, "validate").mockReturnValueOnce(
      new MissingParamError("projectName")
    );
    const request = {
      body: {
        projectName: "",
        fileName: "any_file",
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(MissingParamError);
  });

  it("should call GrepFileUseCase with correct values", async () => {
    const { sut, grepFileUseCaseStub } = makeSut();
    const grepFileSpy = vi.spyOn(grepFileUseCaseStub, "grepFile");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search term",
        contextLines: 3,
        caseSensitive: false,
      },
    };
    await sut.handle(request);
    expect(grepFileSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      fileName: "any_file",
      pattern: "search term",
      contextLines: 3,
      caseSensitive: false,
    });
  });

  it("should call GrepFileUseCase with default values when optionals omitted", async () => {
    const { sut, grepFileUseCaseStub } = makeSut();
    const grepFileSpy = vi.spyOn(grepFileUseCaseStub, "grepFile");
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search term",
      },
    };
    await sut.handle(request);
    expect(grepFileSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      fileName: "any_file",
      pattern: "search term",
      contextLines: undefined,
      caseSensitive: undefined,
    });
  });

  it("should return 404 if GrepFileUseCase returns null", async () => {
    const { sut, grepFileUseCaseStub } = makeSut();
    vi.spyOn(grepFileUseCaseStub, "grepFile").mockResolvedValueOnce(null);
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeInstanceOf(NotFoundError);
  });

  it("should return 500 if GrepFileUseCase throws", async () => {
    const { sut, grepFileUseCaseStub } = makeSut();
    vi.spyOn(grepFileUseCaseStub, "grepFile").mockRejectedValueOnce(
      new Error("any_error")
    );
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBeInstanceOf(UnexpectedError);
  });

  it("should return 200 with grep results on success", async () => {
    const { sut } = makeSut();
    const request = {
      body: {
        projectName: "any_project",
        fileName: "any_file",
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("file_path");
    expect(response.body).toHaveProperty("matches");
    expect(Array.isArray((response.body as any).matches)).toBe(true);
  });

  describe("contextLines validation", () => {
    it("should return 400 for negative contextLines", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          pattern: "search",
          contextLines: -1,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for non-integer contextLines", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          pattern: "search",
          contextLines: 2.5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should accept contextLines = 0", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          pattern: "search",
          contextLines: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
    });

    it("should accept contextLines = 5", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          fileName: "any_file",
          pattern: "search",
          contextLines: 5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
    });
  });
});
