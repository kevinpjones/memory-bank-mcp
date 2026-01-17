import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GetProjectHistoryUseCase,
  GetProjectHistoryRequest,
  GetProjectHistoryResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GetProjectHistoryController implements Controller<GetProjectHistoryRequest, GetProjectHistoryResponse> {
  constructor(
    private readonly getProjectHistoryUseCase: GetProjectHistoryUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<GetProjectHistoryRequest>): Promise<Response<GetProjectHistoryResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName } = request.body!;

      const history = await this.getProjectHistoryUseCase.getProjectHistory({
        projectName,
      });

      return ok(history);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
