import { InvalidParamError, MissingParamError } from "../presentation/errors/index.js";
import { Validator } from "../presentation/protocols/validator.js";

/**
 * Validates that a field is defined and is a string.
 * Allows empty strings but rejects undefined, null, and non-string types.
 */
export class StringFieldValidator implements Validator {
  constructor(private readonly fieldName: string) {}

  validate(input?: any): Error | null {
    if (!input || input[this.fieldName] === undefined || input[this.fieldName] === null) {
      return new MissingParamError(this.fieldName);
    }
    if (typeof input[this.fieldName] !== "string") {
      return new InvalidParamError(this.fieldName);
    }
    return null;
  }
}
