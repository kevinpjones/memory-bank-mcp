import { ListPromptsController } from "../../../../presentation/controllers/index.js";
import { makeListPrompts } from "../../use-cases/index.js";

export const makeListPromptsController = (): ListPromptsController => {
  const listPromptsUseCase = makeListPrompts();
  return new ListPromptsController(listPromptsUseCase);
};