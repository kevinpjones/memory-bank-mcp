export * from "../../protocols/index.js";
export * from "../../../domain/entities/index.js";
export * from "../../../domain/usecases/get-prompt.js";
import { PromptResult } from "../../../domain/entities/index.js";

export interface GetPromptRequest {
  name: string;
  args?: Record<string, any>;
}

export type GetPromptResponse = PromptResult;