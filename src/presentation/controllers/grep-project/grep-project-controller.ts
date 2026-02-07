import { badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GrepProjectRequest,
  GrepProjectResponse,
  GrepProjectUseCase,
  InvalidParamError,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GrepProjectController
  implements Controller<GrepProjectRequest, GrepProjectResponse>
{
  constructor(
    private readonly grepProjectUseCase: GrepProjectUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<GrepProjectRequest>
  ): Promise<Response<GrepProjectResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const {
        projectName,
        pattern,
        contextLines,
        caseSensitive,
        maxResults,
      } = request.body!;

      // Validate optional numeric parameters
      const paramError = this.validateOptionalParams(contextLines, maxResults);
      if (paramError) {
        return badRequest(paramError);
      }

      const result = await this.grepProjectUseCase.grepProject({
        projectName,
        pattern,
        contextLines,
        caseSensitive,
        maxResults,
      });

      if (result === null) {
        return notFound(projectName);
      }

      return ok(result);
    } catch (error) {
      return serverError(error as Error);
    }
  }

  private validateOptionalParams(
    contextLines?: number,
    maxResults?: number
  ): Error | null {
    if (contextLines !== undefined) {
      if (!Number.isInteger(contextLines) || contextLines < 0) {
        return new InvalidParamError(
          "contextLines must be a non-negative integer"
        );
      }
    }
    if (maxResults !== undefined) {
      if (!Number.isInteger(maxResults) || maxResults < 1) {
        return new InvalidParamError(
          "maxResults must be a positive integer"
        );
      }
    }
    return null;
  }
}
