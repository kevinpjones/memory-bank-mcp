import { InvalidParamError } from "../presentation/errors/index.js";
import { Validator } from "../presentation/protocols/validator.js";

/**
 * Reserved directory names that cannot be used as project names
 * These are used internally by the system for history tracking, archiving, and locking
 */
const RESERVED_NAMES = [".history", ".archive", ".locks"];

/**
 * Validates that a field does not contain a reserved directory name.
 * This prevents users from creating projects that would conflict with
 * internal system directories.
 */
export class ReservedNameValidator implements Validator {
  constructor(
    private readonly fieldName: string,
    private readonly reservedNames: string[] = RESERVED_NAMES
  ) {}

  validate(input?: any): Error | null {
    if (!input || !input[this.fieldName]) {
      return null;
    }

    const value = input[this.fieldName];
    if (typeof value === "string" && this.reservedNames.includes(value)) {
      return new InvalidParamError(
        `${this.fieldName} cannot be a reserved name (${this.reservedNames.join(", ")})`
      );
    }

    return null;
  }
}
