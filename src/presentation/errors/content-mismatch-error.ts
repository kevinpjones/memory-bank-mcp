import { BaseError } from "./base-error.js";
import { ErrorName } from "./error-names.js";

export class ContentMismatchError extends BaseError {
  constructor(expected: string, actual: string) {
    super(
      `Content mismatch: expected content does not match file content at specified location. Expected:\n${expected}\n\nActual:\n${actual}`,
      ErrorName.CONTENT_MISMATCH_ERROR
    );
  }
}
