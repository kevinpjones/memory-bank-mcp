import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  RequiredFieldValidator,
  ValidatorComposite,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator("projectName"),
    new PathSecurityValidator("projectName"),
  ];
};

export const makeGetProjectHistoryValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
