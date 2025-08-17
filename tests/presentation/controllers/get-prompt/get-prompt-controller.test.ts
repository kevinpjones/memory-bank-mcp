import { describe, expect, it, vi } from "vitest";
import { GetPromptController } from "../../../../src/presentation/controllers/get-prompt/get-prompt-controller.js";
import { UnexpectedError } from "../../../../src/presentation/errors/index.js";
import { makeGetPromptUseCase } from "../../mocks/index.js";

const makeSut = () => {
  const getPromptUseCaseStub = makeGetPromptUseCase();
  const sut = new GetPromptController(getPromptUseCaseStub);
  return {
    sut,
    getPromptUseCaseStub,
  };
};

describe("GetPromptController", () => {
  it("should call GetPromptUseCase with correct parameters", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    const getPromptSpy = vi.spyOn(getPromptUseCaseStub, "getPrompt");
    
    const request = {
      body: {
        name: "test-prompt",
        args: { message: "hello", tone: "friendly" }
      }
    };
    
    await sut.handle(request);
    
    expect(getPromptSpy).toHaveBeenCalledWith("test-prompt", { message: "hello", tone: "friendly" });
  });

  it("should return 400 if prompt name is missing", async () => {
    const { sut } = makeSut();
    
    const request = {
      body: {
        args: { message: "hello" }
      }
    };
    
    const response = await sut.handle(request);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(Error);
    expect(response.body.message).toBe("Prompt name is required");
  });

  it("should return 400 if request body is missing", async () => {
    const { sut } = makeSut();
    
    const request = {};
    
    const response = await sut.handle(request);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(Error);
    expect(response.body.message).toBe("Prompt name is required");
  });

  it("should return 400 if prompt name is empty string", async () => {
    const { sut } = makeSut();
    
    const request = {
      body: {
        name: "",
        args: { message: "hello" }
      }
    };
    
    const response = await sut.handle(request);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeInstanceOf(Error);
    expect(response.body.message).toBe("Prompt name is required");
  });

  it("should return 500 if GetPromptUseCase throws", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    vi.spyOn(getPromptUseCaseStub, "getPrompt").mockRejectedValueOnce(
      new Error("Prompt not found")
    );
    
    const request = {
      body: {
        name: "non-existent",
        args: {}
      }
    };
    
    const response = await sut.handle(request);
    
    expect(response).toEqual({
      statusCode: 500,
      body: new UnexpectedError(new Error("Prompt not found")),
    });
  });

  it("should return 200 with prompt result on success", async () => {
    const { sut } = makeSut();
    
    const request = {
      body: {
        name: "test-prompt",
        args: { message: "hello", tone: "friendly" }
      }
    };
    
    const response = await sut.handle(request);
    
    expect(response).toEqual({
      statusCode: 200,
      body: {
        description: "A test prompt result",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Say hello in a friendly tone."
            }
          }
        ]
      },
    });
  });

  it("should handle prompt execution without args", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    const getPromptSpy = vi.spyOn(getPromptUseCaseStub, "getPrompt");
    
    const request = {
      body: {
        name: "test-prompt"
      }
    };
    
    await sut.handle(request);
    
    expect(getPromptSpy).toHaveBeenCalledWith("test-prompt", undefined);
  });

  it("should handle prompt execution with empty args", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    const getPromptSpy = vi.spyOn(getPromptUseCaseStub, "getPrompt");
    
    const request = {
      body: {
        name: "test-prompt",
        args: {}
      }
    };
    
    await sut.handle(request);
    
    expect(getPromptSpy).toHaveBeenCalledWith("test-prompt", {});
  });

  it("should propagate validation errors as server errors", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    const validationError = new Error("Required argument 'message' is missing");
    vi.spyOn(getPromptUseCaseStub, "getPrompt").mockRejectedValueOnce(validationError);
    
    const request = {
      body: {
        name: "required-args",
        args: {}
      }
    };
    
    const response = await sut.handle(request);
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toBeInstanceOf(UnexpectedError);
  });

  it("should handle special characters in arguments", async () => {
    const { sut, getPromptUseCaseStub } = makeSut();
    const getPromptSpy = vi.spyOn(getPromptUseCaseStub, "getPrompt");
    
    const request = {
      body: {
        name: "test-prompt",
        args: { 
          message: "hello & goodbye!", 
          tone: "very excited" 
        }
      }
    };
    
    await sut.handle(request);
    
    expect(getPromptSpy).toHaveBeenCalledWith("test-prompt", { 
      message: "hello & goodbye!", 
      tone: "very excited" 
    });
  });
});