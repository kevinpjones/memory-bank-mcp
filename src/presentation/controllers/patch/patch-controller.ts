import { badRequest, notFound, ok, serverError } from "../../helpers/index.js";
import {
  ContentMismatchError,
  Controller,
  InvalidLineRangeError,
  PatchFileUseCase,
  PatchRequest,
  PatchResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class PatchController
  implements Controller<PatchRequest, PatchResponse>
{
  constructor(
    private readonly patchFileUseCase: PatchFileUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<PatchRequest>
  ): Promise<Response<PatchResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, startLine, endLine, oldContent, newContent } =
        request.body!;

      const result = await this.patchFileUseCase.patchFile({
        projectName,
        fileName,
        startLine,
        endLine,
        oldContent,
        newContent,
      });

      if (!result.success) {
        switch (result.error) {
          case "PROJECT_NOT_FOUND":
            return notFound(projectName);
          case "FILE_NOT_FOUND":
            return notFound(fileName);
          case "INVALID_LINE_RANGE":
            return badRequest(
              new InvalidLineRangeError(startLine, endLine, 0)
            );
          case "CONTENT_MISMATCH":
            return badRequest(
              new ContentMismatchError(oldContent, "actual content differs")
            );
          default:
            return notFound(fileName);
        }
      }

      return ok(
        `File ${fileName} patched successfully in project ${projectName}`
      );
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
