import {
  ListPromptsUseCase,
  Prompt,
  PromptRepository,
} from "./list-prompts-protocols.js";

export class ListPrompts implements ListPromptsUseCase {
  constructor(private readonly promptRepository: PromptRepository) {}

  async listPrompts(): Promise<Prompt[]> {
    return this.promptRepository.listPrompts();
  }
}