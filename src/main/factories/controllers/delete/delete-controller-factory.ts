import { DeleteController } from "../../../../presentation/controllers/delete/index.js";
import { makeDeleteFileUseCase } from "../../use-cases/index.js";
import { makeDeleteValidation } from "./delete-validation-factory.js";

export const makeDeleteController = () => {
  const deleteFileUseCase = makeDeleteFileUseCase();
  const validator = makeDeleteValidation();
  return new DeleteController(deleteFileUseCase, validator);
};