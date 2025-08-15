import {
  GetPromptUseCase,
  PromptResult,
  PromptRepository,
} from "./get-prompt-protocols.js";

export class GetPrompt implements GetPromptUseCase {
  constructor(private readonly promptRepository: PromptRepository) {}

  async getPrompt(name: string, args?: Record<string, any>): Promise<PromptResult> {
    return this.promptRepository.executePrompt(name, args);
  }
}