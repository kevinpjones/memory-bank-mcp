import { describe, expect, it } from "vitest";
import { InvalidParamError } from "../../src/presentation/errors/index.js";
import { ReservedNameValidator } from "../../src/validators/reserved-name-validator.js";

describe("ReservedNameValidator", () => {
  it("should return null if field is not provided", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = {};
    const error = sut.validate(input);

    expect(error).toBeNull();
  });

  it("should return null if input is null", () => {
    const sut = new ReservedNameValidator("projectName");
    const error = sut.validate(null);

    expect(error).toBeNull();
  });

  it("should return null if input is undefined", () => {
    const sut = new ReservedNameValidator("projectName");
    const error = sut.validate(undefined);

    expect(error).toBeNull();
  });

  it("should return InvalidParamError if field is '.history'", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: ".history" };
    const error = sut.validate(input);

    expect(error).toBeInstanceOf(InvalidParamError);
    expect(error?.message).toBe(
      "Invalid parameter: projectName cannot be a reserved name (.history, .archive, .locks)"
    );
  });

  it("should return InvalidParamError if field is '.archive'", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: ".archive" };
    const error = sut.validate(input);

    expect(error).toBeInstanceOf(InvalidParamError);
    expect(error?.message).toBe(
      "Invalid parameter: projectName cannot be a reserved name (.history, .archive, .locks)"
    );
  });

  it("should return InvalidParamError if field is '.locks'", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: ".locks" };
    const error = sut.validate(input);

    expect(error).toBeInstanceOf(InvalidParamError);
    expect(error?.message).toBe(
      "Invalid parameter: projectName cannot be a reserved name (.history, .archive, .locks)"
    );
  });

  it("should return null if field is a valid project name", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: "my-project" };
    const error = sut.validate(input);

    expect(error).toBeNull();
  });

  it("should return null if field contains reserved name as substring", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: "project-history" };
    const error = sut.validate(input);

    expect(error).toBeNull();
  });

  it("should return null if field starts with reserved name but has more characters", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: ".history-backup" };
    const error = sut.validate(input);

    expect(error).toBeNull();
  });

  it("should ignore non-string fields", () => {
    const sut = new ReservedNameValidator("projectName");
    const input = { projectName: 123 as any };
    const error = sut.validate(input);

    expect(error).toBeNull();
  });

  it("should use custom reserved names when provided", () => {
    const sut = new ReservedNameValidator("projectName", [".custom", ".special"]);
    
    const error1 = sut.validate({ projectName: ".custom" });
    expect(error1).toBeInstanceOf(InvalidParamError);
    expect(error1?.message).toBe(
      "Invalid parameter: projectName cannot be a reserved name (.custom, .special)"
    );

    const error2 = sut.validate({ projectName: ".history" });
    expect(error2).toBeNull();
  });

  it("should work with different field names", () => {
    const sut = new ReservedNameValidator("customField");
    const input = { customField: ".history" };
    const error = sut.validate(input);

    expect(error).toBeInstanceOf(InvalidParamError);
    expect(error?.message).toBe(
      "Invalid parameter: customField cannot be a reserved name (.history, .archive, .locks)"
    );
  });
});
