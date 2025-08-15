import { Validator } from "../../../../presentation/protocols/validator.js";
import { RequiredFieldValidator } from "../../../../validators/required-field-validator.js";
import { ValidatorComposite } from "../../../../validators/validator-composite.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator('projectName'),
    new RequiredFieldValidator('fileName')
  ];
};

export const makeDeleteValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};