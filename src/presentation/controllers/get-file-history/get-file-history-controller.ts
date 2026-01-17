import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GetFileHistoryUseCase,
  GetFileHistoryRequest,
  GetFileHistoryResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GetFileHistoryController implements Controller<GetFileHistoryRequest, GetFileHistoryResponse> {
  constructor(
    private readonly getFileHistoryUseCase: GetFileHistoryUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<GetFileHistoryRequest>): Promise<Response<GetFileHistoryResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName } = request.body!;

      const history = await this.getFileHistoryUseCase.getFileHistory({
        projectName,
        fileName,
      });

      return ok(history);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
