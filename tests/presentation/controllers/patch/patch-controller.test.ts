import { describe, expect, it, vi } from "vitest";
import { PatchRequest } from "../../../../src/presentation/controllers/patch/protocols.js";
import { PatchController } from "../../../../src/presentation/controllers/patch/patch-controller.js";
import {
  ContentMismatchError,
  InvalidLineRangeError,
  NotFoundError,
  UnexpectedError,
} from "../../../../src/presentation/errors/index.js";
import { makePatchFileUseCase, makeValidator } from "../../mocks/index.js";

const makeSut = () => {
  const validatorStub = makeValidator<PatchRequest>();
  const patchFileUseCaseStub = makePatchFileUseCase();
  const sut = new PatchController(patchFileUseCaseStub, validatorStub);
  return {
    sut,
    validatorStub,
    patchFileUseCaseStub,
  };
};

const makeValidRequest = () => ({
  body: {
    projectName: "any_project",
    fileName: "any_file.md",
    startLine: 1,
    endLine: 3,
    oldContent: "original content",
    newContent: "new content",
  },
});

describe("PatchController", () => {
  describe("Validation", () => {
    it("should call validator with correct values", async () => {
      const { sut, validatorStub } = makeSut();
      const validateSpy = vi.spyOn(validatorStub, "validate");
      const request = makeValidRequest();
      await sut.handle(request);
      expect(validateSpy).toHaveBeenCalledWith(request.body);
    });

    it("should return 400 if validator returns an error", async () => {
      const { sut, validatorStub } = makeSut();
      vi.spyOn(validatorStub, "validate").mockReturnValueOnce(
        new Error("any_error")
      );
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response).toEqual({
        statusCode: 400,
        body: new Error("any_error"),
      });
    });
  });

  describe("Use Case Invocation", () => {
    it("should call PatchFileUseCase with correct values", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      const patchFileSpy = vi.spyOn(patchFileUseCaseStub, "patchFile");
      const request = makeValidRequest();
      await sut.handle(request);
      expect(patchFileSpy).toHaveBeenCalledWith({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 3,
        oldContent: "original content",
        newContent: "new content",
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 404 if PatchFileUseCase returns PROJECT_NOT_FOUND", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      vi.spyOn(patchFileUseCaseStub, "patchFile").mockResolvedValueOnce({
        success: false,
        error: "PROJECT_NOT_FOUND",
      });
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response).toEqual({
        statusCode: 404,
        body: new NotFoundError("any_project"),
      });
    });

    it("should return 404 if PatchFileUseCase returns FILE_NOT_FOUND", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      vi.spyOn(patchFileUseCaseStub, "patchFile").mockResolvedValueOnce({
        success: false,
        error: "FILE_NOT_FOUND",
      });
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response).toEqual({
        statusCode: 404,
        body: new NotFoundError("any_file.md"),
      });
    });

    it("should return 400 if PatchFileUseCase returns INVALID_LINE_RANGE", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      vi.spyOn(patchFileUseCaseStub, "patchFile").mockResolvedValueOnce({
        success: false,
        error: "INVALID_LINE_RANGE",
      });
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidLineRangeError);
    });

    it("should return 400 if PatchFileUseCase returns CONTENT_MISMATCH", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      vi.spyOn(patchFileUseCaseStub, "patchFile").mockResolvedValueOnce({
        success: false,
        error: "CONTENT_MISMATCH",
      });
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(ContentMismatchError);
    });

    it("should return 500 if PatchFileUseCase throws", async () => {
      const { sut, patchFileUseCaseStub } = makeSut();
      vi.spyOn(patchFileUseCaseStub, "patchFile").mockRejectedValueOnce(
        new Error("any_error")
      );
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response).toEqual({
        statusCode: 500,
        body: new UnexpectedError(new Error("any_error")),
      });
    });
  });

  describe("Success Cases", () => {
    it("should return 200 if valid data is provided", async () => {
      const { sut } = makeSut();
      const request = makeValidRequest();
      const response = await sut.handle(request);
      expect(response).toEqual({
        statusCode: 200,
        body: "File any_file.md patched successfully in project any_project",
      });
    });
  });
});
