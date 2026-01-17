import { GetFileAtTimeController } from "../../../../presentation/controllers/get-project-state-at-time/get-project-state-at-time-controller.js";
import { makeGetFileAtTime } from "../../use-cases/get-project-state-at-time-factory.js";
import { makeGetFileAtTimeValidation } from "./get-project-state-at-time-validation-factory.js";

export const makeGetFileAtTimeController = () => {
  const validator = makeGetFileAtTimeValidation();
  const getFileAtTimeUseCase = makeGetFileAtTime();

  return new GetFileAtTimeController(getFileAtTimeUseCase, validator);
};
