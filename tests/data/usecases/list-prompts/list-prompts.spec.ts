import { beforeEach, describe, expect, test, vi } from "vitest";
import { PromptRepository } from "../../../../src/data/protocols/prompt-repository.js";
import { ListPrompts } from "../../../../src/data/usecases/list-prompts/list-prompts.js";
import { MockPromptRepository } from "../../mocks/index.js";

describe("ListPrompts UseCase", () => {
  let sut: ListPrompts;
  let promptRepositoryStub: PromptRepository;

  beforeEach(() => {
    promptRepositoryStub = new MockPromptRepository();
    sut = new ListPrompts(promptRepositoryStub);
  });

  test("should call PromptRepository.listPrompts()", async () => {
    const listPromptsSpy = vi.spyOn(promptRepositoryStub, "listPrompts");

    await sut.listPrompts();

    expect(listPromptsSpy).toHaveBeenCalledTimes(1);
  });

  test("should return a list of prompts on success", async () => {
    const prompts = await sut.listPrompts();

    expect(prompts).toEqual([
      {
        name: "test-prompt",
        title: "Test Prompt",
        description: "A simple test prompt",
        arguments: [
          {
            name: "message",
            description: "The message to display",
            required: true
          },
          {
            name: "tone",
            description: "The tone of the message",
            required: false
          }
        ]
      },
      {
        name: "no-args-prompt",
        title: "No Arguments Prompt",
        description: "A prompt with no arguments",
        arguments: []
      }
    ]);
  });

  test("should propagate errors if repository throws", async () => {
    const error = new Error("Repository error");
    vi.spyOn(promptRepositoryStub, "listPrompts").mockRejectedValueOnce(error);

    await expect(sut.listPrompts()).rejects.toThrow(error);
  });

  test("should return empty array when no prompts exist", async () => {
    vi.spyOn(promptRepositoryStub, "listPrompts").mockResolvedValueOnce([]);

    const prompts = await sut.listPrompts();

    expect(prompts).toEqual([]);
  });

  test("should handle prompts with minimal metadata", async () => {
    const minimalPrompts = [
      {
        name: "minimal-prompt",
        title: undefined,
        description: undefined,
        arguments: undefined
      }
    ];

    vi.spyOn(promptRepositoryStub, "listPrompts").mockResolvedValueOnce(minimalPrompts);

    const prompts = await sut.listPrompts();

    expect(prompts).toEqual(minimalPrompts);
  });
});