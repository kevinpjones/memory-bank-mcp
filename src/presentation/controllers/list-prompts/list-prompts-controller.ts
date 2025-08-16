import { ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  ListPromptsResponse,
  ListPromptsUseCase,
  Response,
} from "./protocols.js";

export class ListPromptsController
  implements Controller<void, ListPromptsResponse>
{
  constructor(private readonly listPromptsUseCase: ListPromptsUseCase) {}

  async handle(): Promise<Response<ListPromptsResponse>> {
    try {
      const prompts = await this.listPromptsUseCase.listPrompts();
      return ok(prompts);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}