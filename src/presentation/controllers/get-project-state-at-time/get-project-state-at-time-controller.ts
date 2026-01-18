import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GetFileAtTimeUseCase,
  GetFileAtTimeRequest,
  GetFileAtTimeResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GetFileAtTimeController implements Controller<GetFileAtTimeRequest, GetFileAtTimeResponse> {
  constructor(
    private readonly getFileAtTimeUseCase: GetFileAtTimeUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<GetFileAtTimeRequest>): Promise<Response<GetFileAtTimeResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, timestamp } = request.body!;

      const result = await this.getFileAtTimeUseCase.getFileAtTime({
        projectName,
        fileName,
        timestamp,
      });

      const response: GetFileAtTimeResponse = {
        timestamp: result.timestamp,
        content: result.content,
        exists: result.exists,
      };

      return ok(response);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
