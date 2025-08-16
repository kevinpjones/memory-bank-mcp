import { GetPrompt } from "../../../data/usecases/get-prompt/get-prompt.js";
import { makePromptRepository } from "../repositories/prompt-repository-factory.js";

export const makeGetPrompt = (): GetPrompt => {
  const promptRepository = makePromptRepository();
  return new GetPrompt(promptRepository);
};