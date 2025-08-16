import { describe, expect, it, vi } from "vitest";
import { ListPromptsController } from "../../../../src/presentation/controllers/list-prompts/list-prompts-controller.js";
import { UnexpectedError } from "../../../../src/presentation/errors/index.js";
import { makeListPromptsUseCase } from "../../mocks/index.js";

const makeSut = () => {
  const listPromptsUseCaseStub = makeListPromptsUseCase();
  const sut = new ListPromptsController(listPromptsUseCaseStub);
  return {
    sut,
    listPromptsUseCaseStub,
  };
};

describe("ListPromptsController", () => {
  it("should call ListPromptsUseCase", async () => {
    const { sut, listPromptsUseCaseStub } = makeSut();
    const listPromptsSpy = vi.spyOn(listPromptsUseCaseStub, "listPrompts");
    
    await sut.handle({});
    
    expect(listPromptsSpy).toHaveBeenCalled();
  });

  it("should return 500 if ListPromptsUseCase throws", async () => {
    const { sut, listPromptsUseCaseStub } = makeSut();
    vi.spyOn(listPromptsUseCaseStub, "listPrompts").mockRejectedValueOnce(
      new Error("any_error")
    );
    
    const response = await sut.handle({});
    
    expect(response).toEqual({
      statusCode: 500,
      body: new UnexpectedError(new Error("any_error")),
    });
  });

  it("should return 200 with prompts on success", async () => {
    const { sut } = makeSut();
    
    const response = await sut.handle({});
    
    expect(response).toEqual({
      statusCode: 200,
      body: [
        {
          name: "test-prompt",
          title: "Test Prompt",
          description: "A simple test prompt",
          arguments: [
            {
              name: "message",
              description: "The message to display",
              required: true
            }
          ]
        },
        {
          name: "another-prompt",
          title: "Another Prompt",
          description: "Another test prompt"
        }
      ],
    });
  });

  it("should return 200 with empty array when no prompts exist", async () => {
    const { sut, listPromptsUseCaseStub } = makeSut();
    vi.spyOn(listPromptsUseCaseStub, "listPrompts").mockResolvedValueOnce([]);
    
    const response = await sut.handle({});
    
    expect(response).toEqual({
      statusCode: 200,
      body: [],
    });
  });

  it("should handle prompts with minimal metadata", async () => {
    const { sut, listPromptsUseCaseStub } = makeSut();
    const minimalPrompts = [
      {
        name: "minimal-prompt",
        title: undefined,
        description: undefined,
        arguments: undefined
      }
    ];
    
    vi.spyOn(listPromptsUseCaseStub, "listPrompts").mockResolvedValueOnce(minimalPrompts);
    
    const response = await sut.handle({});
    
    expect(response).toEqual({
      statusCode: 200,
      body: minimalPrompts,
    });
  });

  it("should handle network/filesystem errors gracefully", async () => {
    const { sut, listPromptsUseCaseStub } = makeSut();
    const networkError = new Error("ENOENT: no such file or directory");
    vi.spyOn(listPromptsUseCaseStub, "listPrompts").mockRejectedValueOnce(networkError);
    
    const response = await sut.handle({});
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toBeInstanceOf(UnexpectedError);
  });
});