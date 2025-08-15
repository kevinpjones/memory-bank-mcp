import { GetPromptController } from "../../../../presentation/controllers/index.js";
import { makeGetPrompt } from "../../use-cases/index.js";

export const makeGetPromptController = (): GetPromptController => {
  const getPromptUseCase = makeGetPrompt();
  return new GetPromptController(getPromptUseCase);
};