import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  RequiredFieldValidator,
  ReservedNameValidator,
  ValidatorComposite,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator("projectName"),
    new RequiredFieldValidator("fileName"),
    new RequiredFieldValidator("pattern"),
    new PathSecurityValidator("projectName"),
    new PathSecurityValidator("fileName"),
    new ReservedNameValidator("projectName"),
  ];
};

export const makeGrepFileValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
