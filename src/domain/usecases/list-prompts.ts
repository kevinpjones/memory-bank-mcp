import { Prompt } from "../entities/index.js";

export interface ListPromptsUseCase {
  listPrompts(): Promise<Prompt[]>;
}