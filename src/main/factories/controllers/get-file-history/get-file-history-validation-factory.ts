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
    new PathSecurityValidator("projectName"),
    new ReservedNameValidator("projectName"),
  ];
};

export const makeGetProjectHistoryValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
