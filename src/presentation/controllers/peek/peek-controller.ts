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

      // Validate previewLines
      if (!Number.isInteger(previewLines) || previewLines < 1) {
        return badRequest(
          new InvalidParamError('previewLines must be a positive integer')
        );
      }

      const content = await this.readFileUseCase.readFile({
        projectName,
        fileName,
      });

      if (content === null) {
        return notFound(fileName);
      }

      const lines = content.split('\n');
      const totalLines = lines.length;
      const effectivePreviewCount = Math.min(previewLines, totalLines);

      const previewContent = lines.slice(0, effectivePreviewCount).join('\n');
      const numberedPreview = addLineNumbers(previewContent, 1, totalLines);

      return ok({
        totalLines,
        fileName,
        previewLineCount: effectivePreviewCount,
        preview: numberedPreview,
      });
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
