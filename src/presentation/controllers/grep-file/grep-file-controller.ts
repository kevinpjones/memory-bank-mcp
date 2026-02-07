import { badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  GrepFileRequest,
  GrepFileResponse,
  GrepFileUseCase,
  InvalidParamError,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class GrepFileController
  implements Controller<GrepFileRequest, GrepFileResponse>
{
  constructor(
    private readonly grepFileUseCase: GrepFileUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<GrepFileRequest>
  ): Promise<Response<GrepFileResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const {
        projectName,
        fileName,
        pattern,
        contextLines,
        caseSensitive,
      } = request.body!;

      // Validate optional numeric parameters
      const paramError = this.validateOptionalParams(contextLines);
      if (paramError) {
        return badRequest(paramError);
      }

      const result = await this.grepFileUseCase.grepFile({
        projectName,
        fileName,
        pattern,
        contextLines,
        caseSensitive,
      });

      if (result === null) {
        return notFound(`${projectName}/${fileName}`);
      }

      return ok(result);
    } catch (error) {
      return serverError(error as Error);
    }
  }

  private validateOptionalParams(contextLines?: number): Error | null {
    if (contextLines !== undefined) {
      if (!Number.isInteger(contextLines) || contextLines < 0) {
        return new InvalidParamError(
          "contextLines must be a non-negative integer"
        );
      }
    }
    return null;
  }
}
