import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  DeleteFileUseCase,
  DeleteRequest,
  DeleteResponse,
  Request,
  Response,
  Validator,
} from "./protocols.js";

export class DeleteController
  implements Controller<DeleteRequest, DeleteResponse>
{
  constructor(
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly validator: Validator
  ) {}

  async handle(request: Request<DeleteRequest>): Promise<Response<DeleteResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName } = request.body!;
      
      const success = await this.deleteFileUseCase.deleteFile({
        projectName,
        fileName,
      });

      return ok({ success });
    } catch (error) {
      return serverError(error as Error);
    }
  }
}