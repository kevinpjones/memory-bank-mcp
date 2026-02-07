import { PeekController } from "../../../../presentation/controllers/peek/peek-controller.js";
import { makeReadFile } from "../../use-cases/read-file-factory.js";
import { makePeekValidation } from "./peek-validation-factory.js";

export const makePeekController = () => {
  const validator = makePeekValidation();
  const readFileUseCase = makeReadFile();

  return new PeekController(readFileUseCase, validator);
};
