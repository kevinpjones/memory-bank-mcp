import { badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GetFileHistoryDiffUseCase,
  GetFileHistoryDiffRequest,
  GetFileHistoryDiffResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GetFileHistoryDiffController implements Controller<GetFileHistoryDiffRequest, GetFileHistoryDiffResponse> {
  constructor(
    private readonly getFileHistoryDiffUseCase: GetFileHistoryDiffUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<GetFileHistoryDiffRequest>): Promise<Response<GetFileHistoryDiffResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, versionFrom, versionTo } = request.body!;

      const result = await this.getFileHistoryDiffUseCase.getFileHistoryDiff({
        projectName,
        fileName,
        versionFrom,
        versionTo,
      });

      if (result === null) {
        return notFound(`Version ${versionFrom}${versionTo ? ` or ${versionTo}` : ""} of file '${fileName}' in project '${projectName}'`);
      }

      return ok(result);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
