import { ok, serverError, badRequest } from "../../helpers/index.js";
import {
  Controller,
  GetPromptRequest,
  GetPromptResponse,
  GetPromptUseCase,
  Response,
  Request,
} from "./protocols.js";

export class GetPromptController
  implements Controller<GetPromptRequest, GetPromptResponse>
{
  constructor(private readonly getPromptUseCase: GetPromptUseCase) {}

  async handle(request: Request<GetPromptRequest>): Promise<Response<GetPromptResponse>> {
    try {
      const requestData = request.body;
      if (!requestData?.name) {
        return badRequest(new Error("Prompt name is required"));
      }

      const result = await this.getPromptUseCase.getPrompt(requestData.name, requestData.args);
      return ok(result);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}