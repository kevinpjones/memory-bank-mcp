import { describe, expect, it, vi } from "vitest";
import { GrepProject } from "../../../../src/data/usecases/grep-project/grep-project.js";
import { FileRepository } from "../../../../src/data/protocols/file-repository.js";
import { ProjectRepository } from "../../../../src/data/protocols/project-repository.js";

const makeFileRepositoryStub = (): FileRepository => {
  return {
    listFiles: vi.fn().mockResolvedValue(["file1.md", "file2.md"]),
    loadFile: vi.fn().mockResolvedValue("content"),
    loadFileLines: vi.fn().mockImplementation(async (_proj: string, fileName: string) => {
      if (fileName === "file1.md") {
        return ["hello world", "foo bar", "hello again"];
      }
      if (fileName === "file2.md") {
        return ["no match here", "another line", "hello final"];
      }
      return null;
    }),
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
  sut: GrepProject;
  fileRepositoryStub: FileRepository;
  projectRepositoryStub: ProjectRepository;
}

const makeSut = (): SutTypes => {
  const fileRepositoryStub = makeFileRepositoryStub();
  const projectRepositoryStub = makeProjectRepositoryStub();
  const sut = new GrepProject(fileRepositoryStub, projectRepositoryStub);
  return {
    sut,
    fileRepositoryStub,
    projectRepositoryStub,
  };
};

describe("GrepProject Use Case", () => {
  describe("Project Validation", () => {
    it("should return null if project does not exist", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(false);

      const result = await sut.grepProject({
        projectName: "non_existent",
        pattern: "search",
      });

      expect(result).toBeNull();
    });

    it("should call projectExists with correct project name", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      const projectExistsSpy = vi.spyOn(projectRepositoryStub, "projectExists");

      await sut.grepProject({
        projectName: "test_project",
        pattern: "search",
      });

      expect(projectExistsSpy).toHaveBeenCalledWith("test_project");
    });
  });

  describe("Search Across Files", () => {
    it("should search across all files in the project", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
      });

      expect(result).not.toBeNull();
      expect(result!.results).toHaveLength(2); // Matches in both files
      expect(result!.total_matches).toBe(3); // 2 in file1 + 1 in file2
      expect(result!.truncated).toBe(false);
    });

    it("should return results grouped by file", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
      });

      expect(result!.results[0].file_path).toBe("file1.md");
      expect(result!.results[0].matches).toHaveLength(2);
      expect(result!.results[1].file_path).toBe("file2.md");
      expect(result!.results[1].matches).toHaveLength(1);
    });

    it("should skip files with no matches", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "foo bar",
        contextLines: 0,
      });

      expect(result!.results).toHaveLength(1); // Only file1 has "foo bar"
      expect(result!.results[0].file_path).toBe("file1.md");
    });

    it("should return empty results when pattern not found in any file", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "xyz_not_found",
      });

      expect(result).not.toBeNull();
      expect(result!.results).toHaveLength(0);
      expect(result!.total_matches).toBe(0);
      expect(result!.truncated).toBe(false);
    });
  });

  describe("maxResults Limiting", () => {
    it("should limit results to maxResults", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
        maxResults: 2,
      });

      expect(result!.total_matches).toBe(2);
      expect(result!.truncated).toBe(true);
    });

    it("should not truncate when matches equal maxResults", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
        maxResults: 3,
      });

      expect(result!.total_matches).toBe(3);
      expect(result!.truncated).toBe(false);
    });

    it("should use default maxResults of 100", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
        // maxResults not specified
      });

      // With only 3 matches, should not truncate with default limit of 100
      expect(result!.total_matches).toBe(3);
      expect(result!.truncated).toBe(false);
    });

    it("should stop searching files once maxResults reached", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce([
        "file1.md",
        "file2.md",
        "file3.md",
      ]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockImplementation(
        async (_proj: string, fileName: string) => {
          if (fileName === "file1.md") {
            return ["match a", "match b"];
          }
          if (fileName === "file2.md") {
            return ["match c"];
          }
          if (fileName === "file3.md") {
            return ["match d"];
          }
          return null;
        }
      );

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "match",
        contextLines: 0,
        maxResults: 2,
      });

      // Should get 2 matches from file1 and stop
      expect(result!.total_matches).toBe(2);
      expect(result!.truncated).toBe(true);
      expect(result!.results).toHaveLength(1); // Only file1
    });

    it("should truncate within a file if needed", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce([
        "file1.md",
        "file2.md",
      ]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockImplementation(
        async (_proj: string, fileName: string) => {
          if (fileName === "file1.md") {
            return ["FIND a", "other line"];
          }
          if (fileName === "file2.md") {
            return ["FIND b", "FIND c", "FIND d"];
          }
          return null;
        }
      );

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "FIND",
        contextLines: 0,
        maxResults: 3,
      });

      // 1 from file1 + 2 from file2 = 3 total
      expect(result!.total_matches).toBe(3);
      expect(result!.truncated).toBe(true);
      expect(result!.results).toHaveLength(2);
      expect(result!.results[0].matches).toHaveLength(1);
      expect(result!.results[1].matches).toHaveLength(2); // Truncated from 3 to 2
    });
  });

  describe("Case Sensitivity", () => {
    it("should search case-sensitively by default", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce(["file.md"]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "Hello",
        "hello",
        "HELLO",
      ]);

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
      });

      expect(result!.total_matches).toBe(1);
    });

    it("should search case-insensitively when specified", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce(["file.md"]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "Hello",
        "hello",
        "HELLO",
      ]);

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
        caseSensitive: false,
      });

      expect(result!.total_matches).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle project with no files", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce([]);

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "search",
      });

      expect(result).not.toBeNull();
      expect(result!.results).toHaveLength(0);
      expect(result!.total_matches).toBe(0);
    });

    it("should skip files that return null from loadFileLines", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce([
        "file1.md",
        "file2.md",
      ]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockImplementation(
        async (_proj: string, fileName: string) => {
          if (fileName === "file1.md") {
            return null; // File can't be read
          }
          if (fileName === "file2.md") {
            return ["match here"];
          }
          return null;
        }
      );

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "match",
        contextLines: 0,
      });

      expect(result!.results).toHaveLength(1);
      expect(result!.results[0].file_path).toBe("file2.md");
    });

    it("should handle maxResults = 1", async () => {
      const { sut } = makeSut();

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "hello",
        contextLines: 0,
        maxResults: 1,
      });

      expect(result!.total_matches).toBe(1);
      expect(result!.truncated).toBe(true);
    });

    it("should include context lines in results", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "listFiles").mockResolvedValueOnce(["file.md"]);
      vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce([
        "before",
        "MATCH",
        "after",
      ]);

      const result = await sut.grepProject({
        projectName: "any_project",
        pattern: "MATCH",
        contextLines: 1,
      });

      const match = result!.results[0].matches[0];
      expect(match.line_start).toBe(1);
      expect(match.line_end).toBe(3);
      expect(match.content).toBe("before\nMATCH\nafter");
    });
  });
});
