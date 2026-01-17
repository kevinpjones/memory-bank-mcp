import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetFileHistoryDiff } from "../../../../src/data/usecases/get-file-history-diff/get-file-history-diff.js";
import { HistoryRepository } from "../../../../src/data/protocols/history-repository.js";
import { FileRepository } from "../../../../src/data/protocols/file-repository.js";
import { HistoryEntry } from "../../../../src/domain/entities/history-entry.js";

const makeHistoryRepositoryStub = (): HistoryRepository => {
  return {
    recordHistory: vi.fn(),
    getFileHistory: vi.fn().mockResolvedValue([]),
    getProjectHistory: vi.fn().mockResolvedValue([]),
    getProjectHistoryMetadata: vi.fn().mockResolvedValue([]),
    getFileAtTime: vi.fn().mockResolvedValue(null),
    getStateAtTime: vi.fn().mockResolvedValue({ timestamp: "", files: new Map() }),
    getFileByVersion: vi.fn().mockResolvedValue(null),
  };
};

const makeFileRepositoryStub = (): FileRepository => {
  return {
    listFiles: vi.fn().mockResolvedValue([]),
    loadFile: vi.fn().mockResolvedValue(null),
    writeFile: vi.fn().mockResolvedValue(null),
    updateFile: vi.fn().mockResolvedValue(null),
    deleteFile: vi.fn().mockResolvedValue(false),
  };
};

interface SutTypes {
  sut: GetFileHistoryDiff;
  historyRepositoryStub: HistoryRepository;
  fileRepositoryStub: FileRepository;
}

const makeSut = (): SutTypes => {
  const historyRepositoryStub = makeHistoryRepositoryStub();
  const fileRepositoryStub = makeFileRepositoryStub();
  const sut = new GetFileHistoryDiff(historyRepositoryStub, fileRepositoryStub);
  return {
    sut,
    historyRepositoryStub,
    fileRepositoryStub,
  };
};

describe("GetFileHistoryDiff", () => {
  describe("getFileHistoryDiff", () => {
    it("should return null if versionFrom does not exist", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion).mockResolvedValue(null);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      });

      expect(result).toBeNull();
    });

    it("should return null if versionTo does not exist", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("content v1")
        .mockResolvedValueOnce(null);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).toBeNull();
    });

    it("should return null if file history is empty when versionTo is not specified", async () => {
      const { sut, historyRepositoryStub, fileRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion).mockResolvedValue("content v1");
      vi.mocked(fileRepositoryStub.loadFile).mockResolvedValue("current content");
      vi.mocked(historyRepositoryStub.getFileHistory).mockResolvedValue([]);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      });

      expect(result).toBeNull();
    });

    it("should return null if current file does not exist when versionTo is not specified", async () => {
      const { sut, historyRepositoryStub, fileRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion).mockResolvedValue("content v1");
      vi.mocked(fileRepositoryStub.loadFile).mockResolvedValue(null);
      vi.mocked(historyRepositoryStub.getFileHistory).mockResolvedValue([
        { version: 1, timestamp: "2024-01-01T00:00:00.000Z", action: "created", actor: "test", projectName: "test-project", fileName: "test.md", content: "content v1" },
      ]);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      });

      expect(result).toBeNull();
    });

    it("should generate unified diff between two specified versions", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("line 1\nline 2\nline 3")
        .mockResolvedValueOnce("line 1\nmodified line 2\nline 3");

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.versionFrom).toBe(1);
      expect(result!.versionTo).toBe(2);
      expect(result!.fileName).toBe("test.md");
      expect(result!.diff).toContain("---");
      expect(result!.diff).toContain("+++");
      expect(result!.diff).toContain("-line 2");
      expect(result!.diff).toContain("+modified line 2");
    });

    it("should generate unified diff comparing to current version when versionTo is not specified", async () => {
      const { sut, historyRepositoryStub, fileRepositoryStub } = makeSut();
      const historyEntries: HistoryEntry[] = [
        { version: 1, timestamp: "2024-01-01T00:00:00.000Z", action: "created", actor: "test", projectName: "test-project", fileName: "test.md", content: "original content" },
        { version: 2, timestamp: "2024-01-02T00:00:00.000Z", action: "modified", actor: "test", projectName: "test-project", fileName: "test.md", content: "modified content" },
      ];

      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("original content") // versionFrom
        .mockResolvedValueOnce("modified content"); // latest version check
      vi.mocked(fileRepositoryStub.loadFile).mockResolvedValue("modified content");
      vi.mocked(historyRepositoryStub.getFileHistory).mockResolvedValue(historyEntries);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.versionFrom).toBe(1);
      expect(result!.versionTo).toBe(2); // Latest version since content matches
      expect(result!.fileName).toBe("test.md");
    });

    it("should use version + 1 when current content differs from latest history", async () => {
      const { sut, historyRepositoryStub, fileRepositoryStub } = makeSut();
      const historyEntries: HistoryEntry[] = [
        { version: 1, timestamp: "2024-01-01T00:00:00.000Z", action: "created", actor: "test", projectName: "test-project", fileName: "test.md", content: "original content" },
      ];

      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("original content") // versionFrom
        .mockResolvedValueOnce("original content"); // latest version check
      vi.mocked(fileRepositoryStub.loadFile).mockResolvedValue("current content differs");
      vi.mocked(historyRepositoryStub.getFileHistory).mockResolvedValue(historyEntries);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.versionTo).toBe(2); // version 1 + 1 since content differs
    });

    it("should return empty diff string when contents are identical", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("same content")
        .mockResolvedValueOnce("same content");

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.diff).toContain("---");
      expect(result!.diff).toContain("+++");
      // No actual changes in the diff body
    });

    it("should include context lines in unified diff", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      const oldContent = "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7";
      const newContent = "line 1\nline 2\nline 3\nMODIFIED\nline 5\nline 6\nline 7";

      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce(oldContent)
        .mockResolvedValueOnce(newContent);

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.diff).toContain("@@");
      expect(result!.diff).toContain("-line 4");
      expect(result!.diff).toContain("+MODIFIED");
    });

    it("should call historyRepository.getFileByVersion with correct parameters", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("content v1")
        .mockResolvedValueOnce("content v2");

      await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(historyRepositoryStub.getFileByVersion).toHaveBeenCalledWith("test-project", "test.md", 1);
      expect(historyRepositoryStub.getFileByVersion).toHaveBeenCalledWith("test-project", "test.md", 2);
    });

    it("should handle multi-line additions", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("line 1\nline 2")
        .mockResolvedValueOnce("line 1\nnew line\nanother new line\nline 2");

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.diff).toContain("+new line");
      expect(result!.diff).toContain("+another new line");
    });

    it("should handle multi-line deletions", async () => {
      const { sut, historyRepositoryStub } = makeSut();
      vi.mocked(historyRepositoryStub.getFileByVersion)
        .mockResolvedValueOnce("line 1\nto delete\nalso delete\nline 2")
        .mockResolvedValueOnce("line 1\nline 2");

      const result = await sut.getFileHistoryDiff({
        projectName: "test-project",
        fileName: "test.md",
        versionFrom: 1,
        versionTo: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.diff).toContain("-to delete");
      expect(result!.diff).toContain("-also delete");
    });
  });
});
