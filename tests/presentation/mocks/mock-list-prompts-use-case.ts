import { ListPromptsUseCase } from "../../../src/domain/usecases/list-prompts.js";
import { Prompt } from "../../../src/domain/entities/index.js";

export class MockListPromptsUseCase implements ListPromptsUseCase {
  async listPrompts(): Promise<Prompt[]> {
    return [
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
    ];
  }
}

export const makeListPromptsUseCase = (): ListPromptsUseCase => {
  return new MockListPromptsUseCase();
};