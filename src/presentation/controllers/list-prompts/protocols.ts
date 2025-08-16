export * from "../../protocols/index.js";
export * from "../../../domain/entities/index.js";
export * from "../../../domain/usecases/list-prompts.js";
import { Prompt } from "../../../domain/entities/index.js";

export type ListPromptsResponse = Prompt[];