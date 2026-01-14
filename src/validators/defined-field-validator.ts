import { MissingParamError } from "../presentation/errors/index.js";
import { Validator } from "../presentation/protocols/validator.js";

/**
 * Validates that a field is defined (not null or undefined).
 * Unlike RequiredFieldValidator, this allows empty strings.
 */
export class DefinedFieldValidator implements Validator {
  constructor(private readonly fieldName: string) {}

  validate(input?: any): Error | null {
    if (!input || input[this.fieldName] === undefined || input[this.fieldName] === null) {
      return new MissingParamError(this.fieldName);
    }
    return null;
  }
}
