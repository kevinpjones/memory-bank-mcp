import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GetProjectStateAtTimeUseCase,
  GetProjectStateAtTimeRequest,
  GetProjectStateAtTimeResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GetProjectStateAtTimeController implements Controller<GetProjectStateAtTimeRequest, GetProjectStateAtTimeResponse> {
  constructor(
    private readonly getProjectStateAtTimeUseCase: GetProjectStateAtTimeUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<GetProjectStateAtTimeRequest>): Promise<Response<GetProjectStateAtTimeResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, timestamp } = request.body!;

      const state = await this.getProjectStateAtTimeUseCase.getProjectStateAtTime({
        projectName,
        timestamp,
      });

      // Convert Map to Record for JSON serialization
      const filesRecord: Record<string, string> = {};
      for (const [fileName, content] of state.files) {
        filesRecord[fileName] = content;
      }

      const response: GetProjectStateAtTimeResponse = {
        timestamp: state.timestamp,
        files: filesRecord,
      };

      return ok(response);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
