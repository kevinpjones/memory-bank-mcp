import { describe, expect, it, vi } from "vitest";
import { GrepProjectRequest } from "../../../../src/presentation/controllers/grep-project/protocols.js";
import { GrepProjectController } from "../../../../src/presentation/controllers/grep-project/grep-project-controller.js";
import {
  InvalidParamError,
  MissingParamError,
  NotFoundError,
  UnexpectedError,
} from "../../../../src/presentation/errors/index.js";
import {
  makeGrepProjectUseCase,
  makeValidator,
} from "../../mocks/index.js";

const makeSut = () => {
  const validatorStub = makeValidator<GrepProjectRequest>();
  const grepProjectUseCaseStub = makeGrepProjectUseCase();
  const sut = new GrepProjectController(
    grepProjectUseCaseStub,
    validatorStub
  );
  return {
    sut,
    validatorStub,
    grepProjectUseCaseStub,
  };
};

describe("GrepProjectController", () => {
  it("should call validator with correct values", async () => {
    const { sut, validatorStub } = makeSut();
    const validateSpy = vi.spyOn(validatorStub, "validate");
    const request = {
      body: {
        projectName: "any_project",
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
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(MissingParamError);
  });

  it("should call GrepProjectUseCase with correct values", async () => {
    const { sut, grepProjectUseCaseStub } = makeSut();
    const grepProjectSpy = vi.spyOn(
      grepProjectUseCaseStub,
      "grepProject"
    );
    const request = {
      body: {
        projectName: "any_project",
        pattern: "search term",
        contextLines: 3,
        caseSensitive: false,
        maxResults: 50,
      },
    };
    await sut.handle(request);
    expect(grepProjectSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      pattern: "search term",
      contextLines: 3,
      caseSensitive: false,
      maxResults: 50,
    });
  });

  it("should call GrepProjectUseCase with default values when optionals omitted", async () => {
    const { sut, grepProjectUseCaseStub } = makeSut();
    const grepProjectSpy = vi.spyOn(
      grepProjectUseCaseStub,
      "grepProject"
    );
    const request = {
      body: {
        projectName: "any_project",
        pattern: "search term",
      },
    };
    await sut.handle(request);
    expect(grepProjectSpy).toHaveBeenCalledWith({
      projectName: "any_project",
      pattern: "search term",
      contextLines: undefined,
      caseSensitive: undefined,
      maxResults: undefined,
    });
  });

  it("should return 404 if GrepProjectUseCase returns null", async () => {
    const { sut, grepProjectUseCaseStub } = makeSut();
    vi.spyOn(grepProjectUseCaseStub, "grepProject").mockResolvedValueOnce(
      null
    );
    const request = {
      body: {
        projectName: "any_project",
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeInstanceOf(NotFoundError);
  });

  it("should return 500 if GrepProjectUseCase throws", async () => {
    const { sut, grepProjectUseCaseStub } = makeSut();
    vi.spyOn(grepProjectUseCaseStub, "grepProject").mockRejectedValueOnce(
      new Error("any_error")
    );
    const request = {
      body: {
        projectName: "any_project",
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
        pattern: "search",
      },
    };
    const response = await sut.handle(request);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("total_matches");
    expect(response.body).toHaveProperty("truncated");
  });

  describe("contextLines validation", () => {
    it("should return 400 for negative contextLines", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
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
          pattern: "search",
          contextLines: 1.5,
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
          pattern: "search",
          contextLines: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("maxResults validation", () => {
    it("should return 400 for maxResults = 0", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          pattern: "search",
          maxResults: 0,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for negative maxResults", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          pattern: "search",
          maxResults: -5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should return 400 for non-integer maxResults", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          pattern: "search",
          maxResults: 10.5,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBeInstanceOf(InvalidParamError);
    });

    it("should accept maxResults = 1", async () => {
      const { sut } = makeSut();
      const request = {
        body: {
          projectName: "any_project",
          pattern: "search",
          maxResults: 1,
        },
      };
      const response = await sut.handle(request);
      expect(response.statusCode).toBe(200);
    });
  });
});
