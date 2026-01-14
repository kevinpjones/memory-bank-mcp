import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  ParamNameValidator,
  RequiredFieldValidator,
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
    new ParamNameValidator("projectName"),
    new ParamNameValidator("fileName"),
    new PathSecurityValidator("projectName"),
    new PathSecurityValidator("fileName"),
  ];
};

export const makePatchValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
