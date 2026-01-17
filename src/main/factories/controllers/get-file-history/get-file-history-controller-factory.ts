import { GetProjectHistoryController } from "../../../../presentation/controllers/get-file-history/get-file-history-controller.js";
import { makeGetProjectHistory } from "../../use-cases/get-file-history-factory.js";
import { makeGetProjectHistoryValidation } from "./get-file-history-validation-factory.js";

export const makeGetProjectHistoryController = () => {
  const validator = makeGetProjectHistoryValidation();
  const getProjectHistoryUseCase = makeGetProjectHistory();

  return new GetProjectHistoryController(getProjectHistoryUseCase, validator);
};
