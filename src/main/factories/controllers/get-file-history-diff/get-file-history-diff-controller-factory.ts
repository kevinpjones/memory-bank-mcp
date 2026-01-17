import { GetFileHistoryDiffController } from "../../../../presentation/controllers/get-file-history-diff/get-file-history-diff-controller.js";
import { makeGetFileHistoryDiff } from "../../use-cases/get-file-history-diff-factory.js";
import { makeGetFileHistoryDiffValidation } from "./get-file-history-diff-validation-factory.js";

export const makeGetFileHistoryDiffController = () => {
  const validator = makeGetFileHistoryDiffValidation();
  const getFileHistoryDiffUseCase = makeGetFileHistoryDiff();

  return new GetFileHistoryDiffController(getFileHistoryDiffUseCase, validator);
};
