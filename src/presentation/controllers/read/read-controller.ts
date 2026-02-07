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

      const content = await this.readFileUseCase.readFile({
        projectName,
        fileName,
      });

      if (content === null) {
        return notFound(fileName);
      }

      // Apply partial read if any line parameters are specified
      const hasLineParams = startLine !== undefined || endLine !== undefined || maxLines !== undefined;
      let resultContent: string;
      let actualStartLine = 1;

      if (hasLineParams) {
        const lines = content.split('\n');
        const totalLines = lines.length;

        // Resolve effective start and end (1-based, inclusive)
        let effectiveStart = startLine ?? 1;
        let effectiveEnd = endLine ?? totalLines;

        // Apply maxLines constraint
        if (maxLines !== undefined) {
          const maxEnd = effectiveStart + maxLines - 1;
          effectiveEnd = Math.min(effectiveEnd, maxEnd);
        }

        // Validate resolved range against file bounds
        if (effectiveStart > totalLines) {
          return badRequest(
            new InvalidParamError(
              `startLine (${effectiveStart}) exceeds total lines in file (${totalLines})`
            )
          );
        }

        // Clamp effectiveEnd to file bounds (graceful handling)
        effectiveEnd = Math.min(effectiveEnd, totalLines);

        // Slice lines (convert 1-based to 0-based)
        const slicedLines = lines.slice(effectiveStart - 1, effectiveEnd);
        resultContent = slicedLines.join('\n');
        actualStartLine = effectiveStart;

        // Add line numbers if requested, with correct offset
        if (includeLineNumbers) {
          resultContent = addLineNumbers(resultContent, actualStartLine, totalLines);
        }
      } else {
        // No line params — return full content
        resultContent = includeLineNumbers ? addLineNumbers(content) : content;
      }

      return ok(resultContent);
    } catch (error) {
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
