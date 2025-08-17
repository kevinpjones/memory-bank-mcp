import { beforeEach, describe, expect, test, vi } from "vitest";
import { PromptRepository } from "../../../../src/data/protocols/prompt-repository.js";
import { GetPrompt } from "../../../../src/data/usecases/get-prompt/get-prompt.js";
import { MockPromptRepository } from "../../mocks/index.js";

describe("GetPrompt UseCase", () => {
  let sut: GetPrompt;
  let promptRepositoryStub: PromptRepository;

  beforeEach(() => {
    promptRepositoryStub = new MockPromptRepository();
    sut = new GetPrompt(promptRepositoryStub);
  });

  test("should call PromptRepository.executePrompt() with correct parameters", async () => {
    const executePromptSpy = vi.spyOn(promptRepositoryStub, "executePrompt");
    const promptName = "test-prompt";
    const args = { message: "hello", tone: "friendly" };

    await sut.getPrompt(promptName, args);

    expect(executePromptSpy).toHaveBeenCalledTimes(1);
    expect(executePromptSpy).toHaveBeenCalledWith(promptName, args);
  });

  test("should return prompt result on success", async () => {
    const promptName = "test-prompt";
    const args = { message: "hello", tone: "friendly" };

    const result = await sut.getPrompt(promptName, args);

    expect(result).toEqual({
      description: "A simple test prompt",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Say hello in a friendly tone."
          }
        }
      ]
    });
  });

  test("should call executePrompt without args when none provided", async () => {
    const executePromptSpy = vi.spyOn(promptRepositoryStub, "executePrompt");
    const promptName = "no-args-prompt"; // Use prompt without required args

    await sut.getPrompt(promptName);

    expect(executePromptSpy).toHaveBeenCalledWith(promptName, undefined);
  });

  test("should propagate errors if repository throws", async () => {
    const error = new Error("Prompt not found");
    vi.spyOn(promptRepositoryStub, "executePrompt").mockRejectedValueOnce(error);

    await expect(sut.getPrompt("non-existent")).rejects.toThrow(error);
  });

  test("should handle prompt execution with empty args", async () => {
    const executePromptSpy = vi.spyOn(promptRepositoryStub, "executePrompt");
    const promptName = "no-args-prompt"; // Use prompt without required args
    const args = {};

    await sut.getPrompt(promptName, args);

    expect(executePromptSpy).toHaveBeenCalledWith(promptName, args);
  });

  test("should propagate validation errors from repository", async () => {
    const validationError = new Error("Required argument 'message' is missing");
    vi.spyOn(promptRepositoryStub, "executePrompt").mockRejectedValueOnce(validationError);

    await expect(sut.getPrompt("test-prompt", {})).rejects.toThrow(validationError);
  });

  test("should handle prompts with no arguments", async () => {
    const promptName = "no-args-prompt";

    const result = await sut.getPrompt(promptName);

    expect(result).toEqual({
      description: "A prompt with no arguments",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "This is a simple prompt with no parameters."
          }
        }
      ]
    });
  });
});