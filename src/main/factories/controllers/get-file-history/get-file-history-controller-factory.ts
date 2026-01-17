import { GetFileHistoryController } from "../../../../presentation/controllers/get-file-history/get-file-history-controller.js";
import { makeGetFileHistory } from "../../use-cases/get-file-history-factory.js";
import { makeGetFileHistoryValidation } from "./get-file-history-validation-factory.js";

export const makeGetFileHistoryController = () => {
  const validator = makeGetFileHistoryValidation();
  const getFileHistoryUseCase = makeGetFileHistory();

  return new GetFileHistoryController(getFileHistoryUseCase, validator);
};
