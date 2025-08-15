import { Prompt, PromptFileContent, PromptResult } from "../../domain/entities/index.js";

export interface PromptRepository {
  listPrompts(): Promise<Prompt[]>;
  getPrompt(name: string): Promise<PromptFileContent>;
  promptExists(name: string): Promise<boolean>;
  executePrompt(name: string, args?: Record<string, any>): Promise<PromptResult>;
}