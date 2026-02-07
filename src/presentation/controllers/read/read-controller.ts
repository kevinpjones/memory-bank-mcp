import { addLineNumbers, badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  InvalidParamError,
  ReadFileUseCase,
  ReadRequest,
  ReadResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class ReadController implements Controller<ReadRequest, ReadResponse> {
  constructor(
    private readonly readFileUseCase: ReadFileUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<ReadRequest>): Promise<Response<ReadResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const {
        projectName,
        fileName,
        includeLineNumbers = true,
        startLine,
        endLine,
        maxLines,
      } = request.body!;

      // Validate optional line parameters
      const paramError = this.validateLineParams(startLine, endLine, maxLines);
      if (paramError) {
        return badRequest(paramError);
      }

      // All reads go through readFilePartial for consistent readline-based
      // line counting. When no line params are specified, it returns the full file.
      const result = await this.readFileUseCase.readFilePartial({
        projectName,
        fileName,
        startLine,
        endLine,
        maxLines,
      });

      if (result === null) {
        return notFound(fileName);
      }

      let resultContent = result.content;
      if (includeLineNumbers) {
        resultContent = addLineNumbers(resultContent, result.startLine, result.totalLines);
      }

      return ok(resultContent);
    } catch (error) {
      if (error instanceof RangeError) {
        return badRequest(new InvalidParamError(error.message));
      }
      return serverError(error as Error);
    }
  }

  private validateLineParams(
    startLine?: number,
    endLine?: number,
    maxLines?: number
  ): Error | null {
    if (startLine !== undefined) {
      if (!Number.isInteger(startLine) || startLine < 1) {
        return new InvalidParamError('startLine must be a positive integer (1-based)');
      }
    }

    if (endLine !== undefined) {
      if (!Number.isInteger(endLine) || endLine < 1) {
        return new InvalidParamError('endLine must be a positive integer (1-based)');
      }
    }

    if (maxLines !== undefined) {
      if (!Number.isInteger(maxLines) || maxLines < 1) {
        return new InvalidParamError('maxLines must be a positive integer');
      }
    }

    if (startLine !== undefined && endLine !== undefined && startLine > endLine) {
      return new InvalidParamError(
        `startLine (${startLine}) must not be greater than endLine (${endLine})`
      );
    }

    return null;
  }
}
