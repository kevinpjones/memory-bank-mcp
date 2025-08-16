import { ListPrompts } from "../../../data/usecases/list-prompts/list-prompts.js";
import { makePromptRepository } from "../repositories/prompt-repository-factory.js";

export const makeListPrompts = (): ListPrompts => {
  const promptRepository = makePromptRepository();
  return new ListPrompts(promptRepository);
};