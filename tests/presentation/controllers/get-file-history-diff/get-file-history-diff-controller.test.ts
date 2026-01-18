import { describe, it, expect, vi } from "vitest";
import { GetFileHistoryDiffController } from "../../../../src/presentation/controllers/get-file-history-diff/get-file-history-diff-controller.js";
import { GetFileHistoryDiffUseCase, GetFileHistoryDiffResult } from "../../../../src/domain/usecases/get-file-history-diff.js";
import { Validator } from "../../../../src/presentation/protocols/validator.js";
import { MissingParamError } from "../../../../src/presentation/errors/missing-param-error.js";

const makeGetFileHistoryDiffUseCaseStub = (): GetFileHistoryDiffUseCase => {
  return {
    getFileHistoryDiff: vi.fn().mockResolvedValue({
      diff: "--- test.md (version 1)\n+++ test.md (version 2)\n@@ -1 +1 @@\n-old\n+new",
      versionFrom: 1,
      versionTo: 2,
      fileName: "test.md",
    } as GetFileHistoryDiffResult),
  };
};

const makeValidatorStub = (): Validator => {
  return {
    validate: vi.fn().mockReturnValue(null),
  };
};

interface SutTypes {
  sut: GetFileHistoryDiffController;
  getFileHistoryDiffUseCaseStub: GetFileHistoryDiffUseCase;
  validatorStub: Validator;
}

const makeSut = (): SutTypes => {
  const getFileHistoryDiffUseCaseStub = makeGetFileHistoryDiffUseCaseStub();
  const validatorStub = makeValidatorStub();
  const sut = new GetFileHistoryDiffController(getFileHistoryDiffUseCaseStub, validatorStub);
  return {
    sut,
    getFileHistoryDiffUseCaseStub,
    validatorStub,
  };
};

describe("GetFileHistoryDiffController", () => {
  it("should call validator with correct values", async () => {
    const { sut, validatorStub } = makeSut();
    const validateSpy = vi.spyOn(validatorStub, "validate");

    await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      },
    });

    expect(validateSpy).toHaveBeenCalledWith({
      projectName: "test-project",
      fileName: "test.md",
      versionFrom: 1,
      versionTo: 2,
    });
  });

  it("should return 400 if validation fails", async () => {
    const { sut, validatorStub } = makeSut();
    vi.spyOn(validatorStub, "validate").mockReturnValue(new MissingParamError("projectName"));

    const response = await sut.handle({
      body: {
        projectName: "",
        fileName: "test.md",
        versionFrom: 1,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(MissingParamError);
  });

  it("should call getFileHistoryDiffUseCase with correct parameters", async () => {
    const { sut, getFileHistoryDiffUseCaseStub } = makeSut();
    const getFileHistoryDiffSpy = vi.spyOn(getFileHistoryDiffUseCaseStub, "getFileHistoryDiff");

    await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      },
    });

    expect(getFileHistoryDiffSpy).toHaveBeenCalledWith({
      projectName: "test-project",
      fileName: "test.md",
      versionFrom: 1,
      versionTo: 2,
    });
  });

  it("should call getFileHistoryDiffUseCase without versionTo when not provided", async () => {
    const { sut, getFileHistoryDiffUseCaseStub } = makeSut();
    const getFileHistoryDiffSpy = vi.spyOn(getFileHistoryDiffUseCaseStub, "getFileHistoryDiff");

    await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      },
    });

    expect(getFileHistoryDiffSpy).toHaveBeenCalledWith({
      projectName: "test-project",
      fileName: "test.md",
      versionFrom: 1,
      versionTo: undefined,
    });
  });

  it("should return 404 if use case returns null", async () => {
    const { sut, getFileHistoryDiffUseCaseStub } = makeSut();
    vi.spyOn(getFileHistoryDiffUseCaseStub, "getFileHistoryDiff").mockResolvedValue(null);

    const response = await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 with descriptive message when version not found", async () => {
    const { sut, getFileHistoryDiffUseCaseStub } = makeSut();
    vi.spyOn(getFileHistoryDiffUseCaseStub, "getFileHistoryDiff").mockResolvedValue(null);

    const response = await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain("test.md");
    expect(response.body.message).toContain("test-project");
  });

  it("should return 200 with diff result on success", async () => {
    const { sut } = makeSut();

    const response = await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      diff: "--- test.md (version 1)\n+++ test.md (version 2)\n@@ -1 +1 @@\n-old\n+new",
      versionFrom: 1,
      versionTo: 2,
      fileName: "test.md",
    });
  });

  it("should return 500 if use case throws", async () => {
    const { sut, getFileHistoryDiffUseCaseStub } = makeSut();
    vi.spyOn(getFileHistoryDiffUseCaseStub, "getFileHistoryDiff").mockRejectedValue(new Error("Unexpected error"));

    const response = await sut.handle({
      body: {
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      },
    });

    expect(response.statusCode).toBe(500);
  });

  it("should handle request with only required parameters", async () => {
    const { sut } = makeSut();

    const response = await sut.handle({
      body: {
        projectName: "my-project",
        fileName: "readme.md",
        versionFrom: 3,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should handle request with all parameters", async () => {
    const { sut } = makeSut();

    const response = await sut.handle({
      body: {
        projectName: "my-project",
        fileName: "readme.md",
        versionFrom: 1,
        versionTo: 5,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
