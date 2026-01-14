import { describe, expect, it } from "vitest";
import { StringFieldValidator } from "../../src/validators/string-field-validator.js";
import { InvalidParamError, MissingParamError } from "../../src/presentation/errors/index.js";

describe("StringFieldValidator", () => {
  describe("when input is undefined", () => {
    it("should return MissingParamError", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate(undefined);
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when input is null", () => {
    it("should return MissingParamError", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate(null);
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is undefined", () => {
    it("should return MissingParamError", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ otherField: "value" });
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is null", () => {
    it("should return MissingParamError", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: null });
      expect(error).toEqual(new MissingParamError("anyField"));
    });
  });

  describe("when field is not a string", () => {
    it("should return InvalidParamError for number", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: 123 });
      expect(error).toEqual(new InvalidParamError("anyField"));
    });

    it("should return InvalidParamError for boolean", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: true });
      expect(error).toEqual(new InvalidParamError("anyField"));
    });

    it("should return InvalidParamError for object", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: { nested: "value" } });
      expect(error).toEqual(new InvalidParamError("anyField"));
    });

    it("should return InvalidParamError for array", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: ["a", "b"] });
      expect(error).toEqual(new InvalidParamError("anyField"));
    });
  });

  describe("when field is a string", () => {
    it("should return null for empty string", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: "" });
      expect(error).toBeNull();
    });

    it("should return null for non-empty string", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: "any_value" });
      expect(error).toBeNull();
    });

    it("should return null for string with whitespace", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: "  spaces  " });
      expect(error).toBeNull();
    });

    it("should return null for string with newlines", () => {
      const sut = new StringFieldValidator("anyField");
      const error = sut.validate({ anyField: "line1\nline2" });
      expect(error).toBeNull();
    });
  });
});
