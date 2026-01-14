import { describe, expect, it } from "vitest";
import { DefinedFieldValidator } from "../../src/validators/defined-field-validator.js";
import { MissingParamError } from "../../src/presentation/errors/index.js";

describe("DefinedFieldValidator", () => {
  describe("when input is undefined", () => {
    it("should return MissingParamError", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate(undefined);
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when input is null", () => {
    it("should return MissingParamError", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate(null);
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is undefined", () => {
    it("should return MissingParamError", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ otherField: "value" });
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is null", () => {
    it("should return MissingParamError", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: null });
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is empty string", () => {
    it("should return null (allow empty strings)", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: "" });
      expect(error).toBeNull();
    });
  });

  describe("when field has value", () => {
    it("should return null for string value", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: "any_value" });
      expect(error).toBeNull();
    });

    it("should return null for number value", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: 123 });
      expect(error).toBeNull();
    });

    it("should return null for zero", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: 0 });
      expect(error).toBeNull();
    });

    it("should return null for false", () => {
      const sut = new DefinedFieldValidator("anyField");
      const error = sut.validate({ anyField: false });
      expect(error).toBeNull();
    });
  });
});
