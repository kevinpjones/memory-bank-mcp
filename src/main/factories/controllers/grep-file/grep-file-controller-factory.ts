import { GrepFileController } from "../../../../presentation/controllers/grep-file/grep-file-controller.js";
import { makeGrepFile } from "../../use-cases/grep-file-factory.js";
import { makeGrepFileValidation } from "./grep-file-validation-factory.js";

export const makeGrepFileController = () => {
  const validator = makeGrepFileValidation();
  const grepFileUseCase = makeGrepFile();

  return new GrepFileController(grepFileUseCase, validator);
};
