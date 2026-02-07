import { describe, expect, it, vi } from "vitest";
import { GrepFile, searchLines } from "../../../../src/data/usecases/grep-file/grep-file.js";
import { FileRepository } from "../../../../src/data/protocols/file-repository.js";
import { ProjectRepository } from "../../../../src/data/protocols/project-repository.js";

const makeFileRepositoryStub = (): FileRepository => {
  return {
    listFiles: vi.fn().mockResolvedValue([]),
    loadFile: vi.fn().mockResolvedValue("line 1\nline 2\nline 3\nline 4\nline 5"),
    loadFileLines: vi.fn().mockResolvedValue([
      "line 1",
      "line 2",
      "line 3",
      "line 4",
      "line 5",
    ]),
    writeFile: vi.fn().mockResolvedValue("content"),
    updateFile: vi.fn().mockResolvedValue("updated content"),
    deleteFile: vi.fn().mockResolvedValue(true),
  };
};

const makeProjectRepositoryStub = (): ProjectRepository => {
  return {
    listProjects: vi.fn().mockResolvedValue([]),
    projectExists: vi.fn().mockResolvedValue(true),
    ensureProject: vi.fn().mockResolvedValue(undefined),
  };
};

interface SutTypes {
  sut: GrepFile;
  fileRepositoryStub: FileRepository;
  projectRepositoryStub: ProjectRepository;
}

const makeSut = (): SutTypes => {
  const fileRepositoryStub = makeFileRepositoryStub();
  const projectRepositoryStub = makeProjectRepositoryStub();
  const sut = new GrepFile(fileRepositoryStub, projectRepositoryStub);
  return {
    sut,
    fileRepositoryStub,
    projectRepositoryStub,
  };
};

describe("GrepFile Use Case", () => {
  describe("Project Validation", () => {
    it("should return null if project does not exist", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(false);

      const result = await sut.grepFile({
        projectName: "non_existent",
        fileName: "any_file.md",
        pattern: "search",
      });

      expect(result).toBeNull();
    });

    it("should call projectExists with correct project name", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      const projectExistsSpy = vi.spyOn(projectRepositoryStub, "projectExists");

      await sut.grepFile({
        projectName: "test_project",
        fileName: "any_file.md",
        pattern: "search",
      });

      expect(projectExistsSpy).toHaveBeenCalledWith("test_project");
    });
  });

  describe("File Validation", () => {
    it("should return null if file does not exist", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce(null);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "non_existent.md",
        pattern: "search",
      });

      expect(result).toBeNull();
    });

    it("should call loadFileLines with correct parameters", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      const loadFileLinesSpy = vi.spyOn(fileRepositoryStub, "loadFileLines");

      await sut.grepFile({
        projectName: "test_project",
        fileName: "test_file.md",
        pattern: "search",
      });

      expect(loadFileLinesSpy).toHaveBeenCalledWith("test_project", "test_file.md");
    });
  });

  describe("Search Functionality", () => {
    it("should find a match in the file", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "hello world",
        "foo bar",
        "hello again",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "hello",
        contextLines: 0,
      });

      expect(result).not.toBeNull();
      expect(result!.file_path).toBe("any_file.md");
      expect(result!.matches).toHaveLength(2);
      expect(result!.matches[0].match_line).toBe(1);
      expect(result!.matches[1].match_line).toBe(3);
    });

    it("should return empty matches when pattern not found", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "hello world",
        "foo bar",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "xyz",
      });

      expect(result).not.toBeNull();
      expect(result!.matches).toHaveLength(0);
    });

    it("should include context lines around matches", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "line 1",
        "line 2",
        "MATCH HERE",
        "line 4",
        "line 5",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "MATCH",
        contextLines: 2,
      });

      expect(result!.matches).toHaveLength(1);
      const match = result!.matches[0];
      expect(match.match_line).toBe(3);
      expect(match.line_start).toBe(1);
      expect(match.line_end).toBe(5);
      expect(match.content).toBe("line 1\nline 2\nMATCH HERE\nline 4\nline 5");
    });

    it("should use default contextLines of 2", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "line 1",
        "line 2",
        "MATCH HERE",
        "line 4",
        "line 5",
        "line 6",
        "line 7",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "MATCH",
        // contextLines not specified, should default to 2
      });

      expect(result!.matches).toHaveLength(1);
      const match = result!.matches[0];
      expect(match.line_start).toBe(1);
      expect(match.line_end).toBe(5);
    });

    it("should handle case-sensitive search (default)", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "Hello World",
        "hello world",
        "HELLO WORLD",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "hello",
        contextLines: 0,
      });

      expect(result!.matches).toHaveLength(1);
      expect(result!.matches[0].match_line).toBe(2);
    });

    it("should handle case-insensitive search", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "Hello World",
        "hello world",
        "HELLO WORLD",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "hello",
        contextLines: 0,
        caseSensitive: false,
      });

      expect(result!.matches).toHaveLength(3);
    });

    it("should handle empty file", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "search",
      });

      expect(result).not.toBeNull();
      expect(result!.matches).toHaveLength(0);
    });

    it("should handle empty pattern", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "line 1",
        "line 2",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "",
      });

      expect(result!.matches).toHaveLength(0);
    });
  });

  describe("Context Line Boundaries", () => {
    it("should clamp context at start of file", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "MATCH HERE",
        "line 2",
        "line 3",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "MATCH",
        contextLines: 5,
      });

      const match = result!.matches[0];
      expect(match.line_start).toBe(1); // Can't go below 1
      expect(match.line_end).toBe(3); // File only has 3 lines
    });

    it("should clamp context at end of file", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "line 1",
        "line 2",
        "MATCH HERE",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "MATCH",
        contextLines: 5,
      });

      const match = result!.matches[0];
      expect(match.line_start).toBe(1);
      expect(match.line_end).toBe(3); // Can't go beyond file length
    });

    it("should handle contextLines = 0 (no context)", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "line 1",
        "MATCH HERE",
        "line 3",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "MATCH",
        contextLines: 0,
      });

      const match = result!.matches[0];
      expect(match.line_start).toBe(2);
      expect(match.line_end).toBe(2);
      expect(match.content).toBe("MATCH HERE");
    });
  });

  describe("Multiple Matches", () => {
    it("should return all matches in a file", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "FIND first",
        "other line",
        "FIND second",
        "other line",
        "FIND third",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "FIND",
        contextLines: 0,
        caseSensitive: true,
      });

      expect(result!.matches).toHaveLength(3);
      expect(result!.matches[0].match_line).toBe(1);
      expect(result!.matches[1].match_line).toBe(3);
      expect(result!.matches[2].match_line).toBe(5);
    });

    it("should handle multiple matches on adjacent lines", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "before",
        "match line A",
        "match line B",
        "after",
      ]);

      const result = await sut.grepFile({
        projectName: "any_project",
        fileName: "any_file.md",
        pattern: "match",
        contextLines: 1,
      });

      expect(result!.matches).toHaveLength(2);
      expect(result!.matches[0].match_line).toBe(2);
      expect(result!.matches[0].line_start).toBe(1);
      expect(result!.matches[0].line_end).toBe(3);
      expect(result!.matches[1].match_line).toBe(3);
      expect(result!.matches[1].line_start).toBe(2);
      expect(result!.matches[1].line_end).toBe(4);
    });
  });
});

describe("searchLines utility", () => {
  it("should return empty array for empty lines", () => {
    const result = searchLines([], "pattern", 2, true);
    expect(result).toEqual([]);
  });

  it("should return empty array for empty pattern", () => {
    const result = searchLines(["line 1", "line 2"], "", 2, true);
    expect(result).toEqual([]);
  });

  it("should find literal string matches", () => {
    const lines = ["foo bar", "baz qux", "foo baz"];
    const result = searchLines(lines, "foo", 0, true);
    expect(result).toHaveLength(2);
    expect(result[0].match_line).toBe(1);
    expect(result[1].match_line).toBe(3);
  });

  it("should handle case-insensitive search", () => {
    const lines = ["FOO", "foo", "Foo"];
    const result = searchLines(lines, "foo", 0, false);
    expect(result).toHaveLength(3);
  });

  it("should handle case-sensitive search", () => {
    const lines = ["FOO", "foo", "Foo"];
    const result = searchLines(lines, "foo", 0, true);
    expect(result).toHaveLength(1);
    expect(result[0].match_line).toBe(2);
  });

  it("should include correct context lines", () => {
    const lines = ["a", "b", "FIND", "d", "e"];
    const result = searchLines(lines, "FIND", 1, true);
    expect(result).toHaveLength(1);
    expect(result[0].line_start).toBe(2);
    expect(result[0].line_end).toBe(4);
    expect(result[0].content).toBe("b\nFIND\nd");
  });

  it("should clamp context to file boundaries", () => {
    const lines = ["FIND", "b"];
    const result = searchLines(lines, "FIND", 5, true);
    expect(result).toHaveLength(1);
    expect(result[0].line_start).toBe(1);
    expect(result[0].line_end).toBe(2);
  });

  it("should handle single-line file", () => {
    const lines = ["only line with match"];
    const result = searchLines(lines, "match", 2, true);
    expect(result).toHaveLength(1);
    expect(result[0].match_line).toBe(1);
    expect(result[0].line_start).toBe(1);
    expect(result[0].line_end).toBe(1);
    expect(result[0].content).toBe("only line with match");
  });

  it("should handle special characters in pattern (no regex)", () => {
    const lines = ["value = (a + b) * c", "simple line"];
    const result = searchLines(lines, "(a + b)", 0, true);
    expect(result).toHaveLength(1);
    expect(result[0].match_line).toBe(1);
  });

  it("should handle pattern with regex special chars", () => {
    const lines = ["file.test.ts", "file_test_ts"];
    const result = searchLines(lines, ".test.", 0, true);
    expect(result).toHaveLength(1);
    expect(result[0].match_line).toBe(1);
  });
});
