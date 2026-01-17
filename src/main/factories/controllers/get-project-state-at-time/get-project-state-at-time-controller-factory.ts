import { GetProjectStateAtTimeController } from "../../../../presentation/controllers/get-project-state-at-time/get-project-state-at-time-controller.js";
import { makeGetProjectStateAtTime } from "../../use-cases/get-project-state-at-time-factory.js";
import { makeGetProjectStateAtTimeValidation } from "./get-project-state-at-time-validation-factory.js";

export const makeGetProjectStateAtTimeController = () => {
  const validator = makeGetProjectStateAtTimeValidation();
  const getProjectStateAtTimeUseCase = makeGetProjectStateAtTime();

  return new GetProjectStateAtTimeController(getProjectStateAtTimeUseCase, validator);
};
