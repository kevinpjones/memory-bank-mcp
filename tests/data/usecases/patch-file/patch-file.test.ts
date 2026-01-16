import { describe, expect, it, vi, beforeEach } from "vitest";
import { PatchFile } from "../../../../src/data/usecases/patch-file/patch-file.js";
import { FileRepository } from "../../../../src/data/protocols/file-repository.js";
import { ProjectRepository } from "../../../../src/data/protocols/project-repository.js";

const makeFileRepositoryStub = (): FileRepository => {
  return {
    listFiles: vi.fn().mockResolvedValue([]),
    loadFile: vi.fn().mockResolvedValue("line 1\nline 2\nline 3\nline 4\nline 5"),
    writeFile: vi.fn().mockResolvedValue("content"),
    updateFile: vi.fn().mockResolvedValue("updated content"),
    deleteFile: vi.fn().mockResolvedValue(true),
  };
};

const makeProjectRepositoryStub = (): ProjectRepository => {
  return {
    listProjects: vi.fn().mockResolvedValue([]),
    projectExists: vi.fn().mockResolvedValue(true),
  };
};

interface SutTypes {
  sut: PatchFile;
  fileRepositoryStub: FileRepository;
  projectRepositoryStub: ProjectRepository;
}

const makeSut = (): SutTypes => {
  const fileRepositoryStub = makeFileRepositoryStub();
  const projectRepositoryStub = makeProjectRepositoryStub();
  const sut = new PatchFile(fileRepositoryStub, projectRepositoryStub);
  return {
    sut,
    fileRepositoryStub,
    projectRepositoryStub,
  };
};

describe("PatchFile Use Case", () => {
  describe("Project Validation", () => {
    it("should return PROJECT_NOT_FOUND if project does not exist", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(false);

      const result = await sut.patchFile({
        projectName: "non_existent_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result).toEqual({ success: false, error: "PROJECT_NOT_FOUND" });
    });

    it("should call projectExists with correct project name", async () => {
      const { sut, projectRepositoryStub } = makeSut();
      const projectExistsSpy = vi.spyOn(projectRepositoryStub, "projectExists");

      await sut.patchFile({
        projectName: "test_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(projectExistsSpy).toHaveBeenCalledWith("test_project");
    });
  });

  describe("File Validation", () => {
    it("should return FILE_NOT_FOUND if file does not exist", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(null);

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "non_existent_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result).toEqual({ success: false, error: "FILE_NOT_FOUND" });
    });

    it("should call loadFile with correct parameters", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      const loadFileSpy = vi.spyOn(fileRepositoryStub, "loadFile");

      await sut.patchFile({
        projectName: "test_project",
        fileName: "test_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(loadFileSpy).toHaveBeenCalledWith("test_project", "test_file.md");
    });
  });

  describe("Line Range Validation", () => {
    it("should return INVALID_LINE_RANGE with totalLines if startLine is less than 1", async () => {
      const { sut } = makeSut();

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 0,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_LINE_RANGE");
      expect(result.errorContext?.totalLines).toBe(5);
    });

    it("should return INVALID_LINE_RANGE with totalLines if endLine is less than startLine", async () => {
      const { sut } = makeSut();

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 3,
        endLine: 2,
        oldContent: "line 2",
        newContent: "new line 2",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_LINE_RANGE");
      expect(result.errorContext?.totalLines).toBe(5);
    });

    it("should return INVALID_LINE_RANGE with totalLines if endLine exceeds total lines", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 10,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_LINE_RANGE");
      expect(result.errorContext?.totalLines).toBe(3);
    });

    it("should return INVALID_LINE_RANGE if startLine is NaN", async () => {
      const { sut } = makeSut();

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: NaN,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_LINE_RANGE");
    });

    it("should return INVALID_LINE_RANGE if endLine is NaN", async () => {
      const { sut } = makeSut();

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: NaN,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_LINE_RANGE");
    });

    it("should accept valid line range at file boundaries", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 3,
        oldContent: "line 1\nline 2\nline 3",
        newContent: "new content",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Content Verification", () => {
    it("should return CONTENT_MISMATCH with actualContent if old content does not match", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("actual line 1\nline 2\nline 3");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "expected line 1",
        newContent: "new line 1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
      expect(result.errorContext?.actualContent).toBe("actual line 1");
    });

    it("should match content exactly for single line", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "line 2",
        newContent: "new line 2",
      });

      expect(result.success).toBe(true);
    });

    it("should match content exactly for multiple lines", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3\nline 4");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 3,
        oldContent: "line 2\nline 3",
        newContent: "new line 2\nnew line 3",
      });

      expect(result.success).toBe(true);
    });

    it("should handle trailing newlines flexibly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1\n",
        newContent: "new line 1",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Patch Application", () => {
    it("should call updateFile with correctly patched content", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1\nline 2\nline 3");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "test_project",
        fileName: "test_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "line 2",
        newContent: "new line 2",
      });

      expect(updateFileSpy).toHaveBeenCalledWith(
        "test_project",
        "test_file.md",
        "line 1\nnew line 2\nline 3"
      );
    });

    it("should replace single line correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "a",
        newContent: "X",
      });

      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "X\nb\nc");
    });

    it("should replace multiple lines correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc\nd");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 3,
        oldContent: "b\nc",
        newContent: "X\nY\nZ",
      });

      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "a\nX\nY\nZ\nd");
    });

    it("should replace at the start of file correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 2,
        oldContent: "a\nb",
        newContent: "X",
      });

      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "X\nc");
    });

    it("should replace at the end of file correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 3,
        oldContent: "b\nc",
        newContent: "X",
      });

      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "a\nX");
    });

    it("should replace entire file correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 3,
        oldContent: "a\nb\nc",
        newContent: "X\nY",
      });

      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "X\nY");
    });
  });

  describe("Cross-Platform Line Ending Support", () => {
    it("should match content in file with CRLF (Windows) line endings against LF oldContent", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      // File has Windows-style CRLF line endings
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\r\nline 2\r\nline 3"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        // oldContent uses Unix-style LF
        oldContent: "line 2",
        newContent: "new line 2",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match content in file with CR (old Mac) line endings against LF oldContent", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      // File has old Mac-style CR line endings
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\rline 2\rline 3"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "line 2",
        newContent: "new line 2",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match content in file with mixed line endings", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      // File has mixed line endings
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\r\nline 2\rline 3\nline 4"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 3,
        oldContent: "line 2\nline 3",
        newContent: "new line 2\nnew line 3",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match oldContent with CRLF against file with LF", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      // File has Unix-style LF line endings
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\nline 2\nline 3"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 2,
        // oldContent uses Windows-style CRLF
        oldContent: "line 1\r\nline 2",
        newContent: "new content",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match oldContent with trailing CRLF against file content without", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\nline 2\nline 3"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        // oldContent has trailing CRLF
        oldContent: "line 2\r\n",
        newContent: "new line 2",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should handle multi-line patch with CRLF line endings in both file and oldContent", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "# Header\r\n\r\nFirst paragraph.\r\n\r\nSecond paragraph."
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 3,
        endLine: 3,
        oldContent: "First paragraph.\r\n",
        newContent: "Updated first paragraph.",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should correctly patch file with CRLF and produce normalized output", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "a\r\nb\r\nc"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "b",
        newContent: "X",
      });

      // After normalization, the file content is split on LF, so output uses LF
      expect(updateFileSpy).toHaveBeenCalledWith(
        "any_project",
        "any_file.md",
        "a\nX\nc"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle single-line file correctly", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("only line");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "only line",
        newContent: "new only line",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalledWith(
        "any_project",
        "any_file.md",
        "new only line"
      );
    });

    it("should handle empty new content (deletion)", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("a\nb\nc");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "b",
        newContent: "",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalledWith("any_project", "any_file.md", "a\n\nc");
    });

    it("should handle special characters in content", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      const specialContent = "line with $pecial ch@rs!\nand `backticks`\nand \"quotes\"";
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(specialContent);
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "and `backticks`",
        newContent: "replaced special",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalledWith(
        "any_project",
        "any_file.md",
        "line with $pecial ch@rs!\nreplaced special\nand \"quotes\""
      );
    });

    it("should handle content with whitespace variations", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("  indented\n\ttabbed\nno indent");
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "  indented",
        newContent: "    more indented",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalledWith(
        "any_project",
        "any_file.md",
        "    more indented\n\ttabbed\nno indent"
      );
    });

    it("should return FILE_NOT_FOUND if updateFile fails", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1");
      vi.spyOn(fileRepositoryStub, "updateFile").mockResolvedValueOnce(null);

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result).toEqual({ success: false, error: "FILE_NOT_FOUND" });
    });
  });

  describe("Success Cases", () => {
    it("should return success with updated content", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce("line 1");
      vi.spyOn(fileRepositoryStub, "updateFile").mockResolvedValueOnce("new line 1");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line 1",
        newContent: "new line 1",
      });

      expect(result).toEqual({ success: true, content: "new line 1" });
    });
  });

  describe("Security - No False Positives", () => {
    it("should reject patch when content differs (different text)", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "actual content\nline 2\nline 3"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "expected content",
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
    });

    it("should reject patch when whitespace in lines differs", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "  indented\nline 2"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "indented", // Missing leading spaces
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
    });

    it("should reject patch when trailing spaces differ", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line with trailing   \nline 2"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "line with trailing", // Missing trailing spaces
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
    });

    it("should reject patch when line count differs", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\nline 2\nline 3"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 2,
        oldContent: "line 1\nline 2\nline 3", // Three lines when range is two lines
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
    });

    it("should reject patch when case differs", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "Hello World\nline 2"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "hello world", // Different case
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
    });

    it("should include actual content in error for debugging", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "actual line 1\nline 2\nline 3"
      );

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 1,
        endLine: 1,
        oldContent: "expected line 1",
        newContent: "new content",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("CONTENT_MISMATCH");
      expect(result.errorContext?.actualContent).toBe("actual line 1");
    });
  });

  describe("Unicode and Special Characters", () => {
    it("should match content with unicode characters", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "Hello 世界\nПривет мир\n🎉 emoji"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "Привет мир",
        newContent: "Hello world",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match content with emojis", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "line 1\n🎉 celebration 🎊\nline 3"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "🎉 celebration 🎊",
        newContent: "party time",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });

    it("should match content with unicode line endings combined with CRLF", async () => {
      const { sut, fileRepositoryStub } = makeSut();
      vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(
        "日本語\r\n中文\r\n한국어"
      );
      const updateFileSpy = vi.spyOn(fileRepositoryStub, "updateFile");

      const result = await sut.patchFile({
        projectName: "any_project",
        fileName: "any_file.md",
        startLine: 2,
        endLine: 2,
        oldContent: "中文",
        newContent: "Chinese",
      });

      expect(result.success).toBe(true);
      expect(updateFileSpy).toHaveBeenCalled();
    });
  });
});
