import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { FsFileRepository } from "../../../../src/infra/filesystem/repositories/fs-file-repository.js";
import { FsHistoryRepository } from "../../../../src/infra/filesystem/repositories/fs-history-repository.js";
import { HistoryTrackingFileRepository } from "../../../../src/infra/filesystem/repositories/history-tracking-file-repository.js";

describe("HistoryTrackingFileRepository", () => {
  let testDir: string;
  let baseFileRepository: FsFileRepository;
  let historyRepository: FsHistoryRepository;
  let repository: HistoryTrackingFileRepository;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "history-tracking-test-"));
    baseFileRepository = new FsFileRepository(testDir);
    historyRepository = new FsHistoryRepository(testDir);
    repository = new HistoryTrackingFileRepository(baseFileRepository, historyRepository, "test-actor");
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("writeFile", () => {
    it("should write file and record 'created' history entry", async () => {
      const result = await repository.writeFile("test-project", "test-file.md", "test content");

      expect(result).toBe("test content");

      // Verify file was written
      const filePath = path.join(testDir, "test-project", "test-file.md");
      expect(await fs.pathExists(filePath)).toBe(true);

      // Verify history was recorded
      const history = await historyRepository.getFileHistory("test-project", "test-file.md");
      expect(history.length).toBe(1);
      expect(history[0].action).toBe("created");
      expect(history[0].actor).toBe("test-actor");
      expect(history[0].content).toBe("test content");
    });

    it("should not record history if file already exists", async () => {
      // Create file first
      await repository.writeFile("test-project", "test-file.md", "original content");

      // Try to write again (should fail)
      const result = await repository.writeFile("test-project", "test-file.md", "new content");

      expect(result).toBeNull();

      // Verify only one history entry exists
      const history = await historyRepository.getFileHistory("test-project", "test-file.md");
      expect(history.length).toBe(1);
    });
  });

  describe("updateFile", () => {
    it("should update file and record 'modified' history entry", async () => {
      // Create file first
      await repository.writeFile("test-project", "test-file.md", "original content");

      // Update file
      const result = await repository.updateFile("test-project", "test-file.md", "updated content");

      expect(result).toBe("updated content");

      // Verify history was recorded
      const history = await historyRepository.getFileHistory("test-project", "test-file.md");
      expect(history.length).toBe(2);
      expect(history[0].action).toBe("created");
      expect(history[1].action).toBe("modified");
      expect(history[1].content).toBe("updated content");
    });

    it("should not record history if file doesn't exist", async () => {
      const result = await repository.updateFile("test-project", "non-existent.md", "content");

      expect(result).toBeNull();

      // Verify no history was recorded
      const history = await historyRepository.getFileHistory("test-project", "non-existent.md");
      expect(history.length).toBe(0);
    });
  });

  describe("deleteFile", () => {
    it("should delete file and record 'deleted' history entry with content", async () => {
      // Create file first
      await repository.writeFile("test-project", "test-file.md", "content to preserve");

      // Delete file
      const result = await repository.deleteFile("test-project", "test-file.md");

      expect(result).toBe(true);

      // Verify file was deleted
      const filePath = path.join(testDir, "test-project", "test-file.md");
      expect(await fs.pathExists(filePath)).toBe(false);

      // Verify history was recorded with content
      const history = await historyRepository.getFileHistory("test-project", "test-file.md");
      expect(history.length).toBe(2);
      expect(history[1].action).toBe("deleted");
      expect(history[1].content).toBe("content to preserve");
    });

    it("should return false and not record history if file doesn't exist", async () => {
      const result = await repository.deleteFile("test-project", "non-existent.md");

      expect(result).toBe(false);

      // Verify no history was recorded
      const history = await historyRepository.getFileHistory("test-project", "non-existent.md");
      expect(history.length).toBe(0);
    });
  });

  describe("read operations (proxied)", () => {
    it("should proxy listFiles to wrapped repository", async () => {
      await repository.writeFile("test-project", "file1.md", "content 1");
      await repository.writeFile("test-project", "file2.md", "content 2");

      const files = await repository.listFiles("test-project");

      expect(files).toContain("file1.md");
      expect(files).toContain("file2.md");
    });

    it("should proxy loadFile to wrapped repository", async () => {
      await repository.writeFile("test-project", "test-file.md", "test content");

      const content = await repository.loadFile("test-project", "test-file.md");

      expect(content).toBe("test content");
    });
  });

  describe("full lifecycle with time-travel", () => {
    it("should enable reconstruction of file state at any point", async () => {
      // Create file
      await repository.writeFile("test-project", "test-file.md", "version 1");
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const afterCreate = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Update file
      await repository.updateFile("test-project", "test-file.md", "version 2");
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const afterUpdate = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Delete file
      await repository.deleteFile("test-project", "test-file.md");
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const afterDelete = new Date().toISOString();

      // Verify state at each point
      const stateAfterCreate = await historyRepository.getStateAtTime("test-project", afterCreate);
      expect(stateAfterCreate.files.get("test-file.md")).toBe("version 1");

      const stateAfterUpdate = await historyRepository.getStateAtTime("test-project", afterUpdate);
      expect(stateAfterUpdate.files.get("test-file.md")).toBe("version 2");

      const stateAfterDelete = await historyRepository.getStateAtTime("test-project", afterDelete);
      expect(stateAfterDelete.files.size).toBe(0);
    });
  });
});
