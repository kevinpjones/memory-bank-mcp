import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  ParamNameValidator,
  RequiredFieldValidator,
  ReservedNameValidator,
  ValidatorComposite,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator("projectName"),
    new RequiredFieldValidator("fileName"),
    new RequiredFieldValidator("content"),
    // Note: ParamNameValidator is NOT applied to projectName because
    // the MCP adapter resolves friendly names to directory names before
    // the controller receives the request.
    new ParamNameValidator("fileName"),
    new PathSecurityValidator("projectName"),
    new PathSecurityValidator("fileName"),
    new ReservedNameValidator("projectName"),
  ];
};

export const makeUpdateValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
