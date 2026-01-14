import { BaseError } from "./base-error.js";
import { ErrorName } from "./error-names.js";

export class InvalidLineRangeError extends BaseError {
  constructor(startLine: number, endLine: number, totalLines: number) {
    super(
      `Invalid line range: startLine=${startLine}, endLine=${endLine}, but file has ${totalLines} lines. Line numbers must be 1-based and within the file bounds.`,
      ErrorName.INVALID_LINE_RANGE_ERROR
    );
  }
}
