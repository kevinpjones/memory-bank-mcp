import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  ParamNameValidator,
  RequiredFieldValidator,
  ReservedNameValidator,
  StringFieldValidator,
  ValidatorComposite,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator("projectName"),
    new RequiredFieldValidator("fileName"),
    new RequiredFieldValidator("startLine"),
    new RequiredFieldValidator("endLine"),
    // Use StringFieldValidator for content fields to allow empty strings and validate type
    new StringFieldValidator("oldContent"),
    new StringFieldValidator("newContent"),
    // Note: ParamNameValidator is NOT applied to projectName because
    // the MCP adapter resolves friendly names to directory names before
    // the controller receives the request.
    new ParamNameValidator("fileName"),
    new PathSecurityValidator("projectName"),
    new PathSecurityValidator("fileName"),
    new ReservedNameValidator("projectName"),
  ];
};

export const makePatchValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
