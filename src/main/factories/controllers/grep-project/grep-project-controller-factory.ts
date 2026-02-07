import { GrepProjectController } from "../../../../presentation/controllers/grep-project/grep-project-controller.js";
import { makeGrepProject } from "../../use-cases/grep-project-factory.js";
import { makeGrepProjectValidation } from "./grep-project-validation-factory.js";

export const makeGrepProjectController = () => {
  const validator = makeGrepProjectValidation();
  const grepProjectUseCase = makeGrepProject();

  return new GrepProjectController(grepProjectUseCase, validator);
};
