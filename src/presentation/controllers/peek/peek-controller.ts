import { addLineNumbers, badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  InvalidParamError,
  PeekFileRequest,
  PeekFileResponse,
  ReadFileUseCase,
  Request,
  Response,
  Validator,
} from "./protocols.js";

const DEFAULT_PREVIEW_LINES = 10;

export class PeekController implements Controller<PeekFileRequest, PeekFileResponse> {
  constructor(
    private readonly readFileUseCase: ReadFileUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<PeekFileRequest>): Promise<Response<PeekFileResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const {
        projectName,
        fileName,
        previewLines = DEFAULT_PREVIEW_LINES,
      } = request.body!;

      const paramError = this.validatePeekParams(previewLines);
      if (paramError) {
        return badRequest(paramError);
      }

      const result = await this.readFileUseCase.readFilePreview({
        projectName,
        fileName,
        maxLines: previewLines,
      });

      if (result === null) {
        return notFound(fileName);
      }

      const { content, totalLines } = result;
      const previewLineCount = content.split("\n").length;
      const numberedPreview = addLineNumbers(content, 1, totalLines);

      return ok({
        totalLines,
        fileName,
        previewLineCount,
        preview: numberedPreview,
      });
    } catch (error) {
      return serverError(error as Error);
    }
  }

  private validatePeekParams(previewLines: number): Error | null {
    if (!Number.isInteger(previewLines) || previewLines < 1) {
      return new InvalidParamError('previewLines must be a positive integer');
    }
    return null;
  }
}
