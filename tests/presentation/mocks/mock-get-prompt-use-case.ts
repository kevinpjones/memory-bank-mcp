import { GetPromptUseCase } from "../../../src/domain/usecases/get-prompt.js";
import { PromptResult } from "../../../src/domain/entities/index.js";

export class MockGetPromptUseCase implements GetPromptUseCase {
  async getPrompt(name: string, args?: Record<string, any>): Promise<PromptResult> {
    if (name === "non-existent") {
      throw new Error(`Prompt '${name}' not found`);
    }

    if (name === "required-args" && (!args || !args.message)) {
      throw new Error("Required argument 'message' is missing");
    }

    let text = "This is a test prompt.";
    if (args?.message) {
      text = `Say ${args.message}`;
      if (args.tone) {
        text += ` in a ${args.tone} tone.`;
      }
    }

    return {
      description: "A test prompt result",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text
          }
        }
      ]
    };
  }
}

export const makeGetPromptUseCase = (): GetPromptUseCase => {
  return new MockGetPromptUseCase();
};