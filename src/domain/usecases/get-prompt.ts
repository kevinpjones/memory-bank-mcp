import { PromptResult } from "../entities/index.js";

export interface GetPromptUseCase {
  getPrompt(name: string, args?: Record<string, any>): Promise<PromptResult>;
}