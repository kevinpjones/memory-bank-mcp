import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { FsHistoryRepository } from "../../../../src/infra/filesystem/repositories/fs-history-repository.js";

describe("FsHistoryRepository", () => {
  let testDir: string;
  let repository: FsHistoryRepository;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "history-test-"));
    repository = new FsHistoryRepository(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("recordHistory", () => {
    it("should create history directory and file if they don't exist", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "test-actor",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "test content",
      });

      const historyPath = path.join(testDir, ".history", "test-project", "test-file.md.history.jsonl");
      expect(await fs.pathExists(historyPath)).toBe(true);
    });

    it("should record history entry with correct fields", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "test-actor",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "test content",
      });

      const historyPath = path.join(testDir, ".history", "test-project", "test-file.md.history.jsonl");
      const content = await fs.readFile(historyPath, "utf-8");
      const entry = JSON.parse(content.trim());

      expect(entry.action).toBe("created");
      expect(entry.actor).toBe("test-actor");
      expect(entry.projectName).toBe("test-project");
      expect(entry.fileName).toBe("test-file.md");
      expect(entry.content).toBe("test content");
      expect(entry.timestamp).toBeDefined();
    });

    it("should append multiple history entries to the same file", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "test-actor",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "initial content",
      });

      await repository.recordHistory({
        action: "modified",
        actor: "test-actor",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "modified content",
      });

      const historyPath = path.join(testDir, ".history", "test-project", "test-file.md.history.jsonl");
      const content = await fs.readFile(historyPath, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines.length).toBe(2);
      expect(JSON.parse(lines[0]).action).toBe("created");
      expect(JSON.parse(lines[1]).action).toBe("modified");
    });

    it("should record deletion with content for recovery", async () => {
      await repository.recordHistory({
        action: "deleted",
        actor: "test-actor",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "content before deletion",
      });

      const history = await repository.getFileHistory("test-project", "test-file.md");
      expect(history[0].action).toBe("deleted");
      expect(history[0].content).toBe("content before deletion");
    });
  });

  describe("getFileHistory", () => {
    it("should return empty array for non-existent history", async () => {
      const history = await repository.getFileHistory("non-existent", "file.md");
      expect(history).toEqual([]);
    });

    it("should return history entries sorted by timestamp ascending", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "content 1",
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await repository.recordHistory({
        action: "modified",
        actor: "actor2",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "content 2",
      });

      const history = await repository.getFileHistory("test-project", "test-file.md");

      expect(history.length).toBe(2);
      expect(history[0].action).toBe("created");
      expect(history[1].action).toBe("modified");
      expect(new Date(history[0].timestamp).getTime()).toBeLessThan(
        new Date(history[1].timestamp).getTime()
      );
    });
  });

  describe("getProjectHistory", () => {
    it("should return empty array for non-existent project", async () => {
      const history = await repository.getProjectHistory("non-existent");
      expect(history).toEqual([]);
    });

    it("should return history for all files in project sorted by timestamp", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "file1.md",
        content: "content 1",
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await repository.recordHistory({
        action: "created",
        actor: "actor2",
        projectName: "test-project",
        fileName: "file2.md",
        content: "content 2",
      });

      const history = await repository.getProjectHistory("test-project");

      expect(history.length).toBe(2);
      expect(history[0].fileName).toBe("file1.md");
      expect(history[1].fileName).toBe("file2.md");
    });
  });

  describe("getStateAtTime", () => {
    it("should return empty state for non-existent project", async () => {
      const state = await repository.getStateAtTime("non-existent", new Date().toISOString());
      expect(state.files.size).toBe(0);
    });

    it("should reconstruct state at a specific point in time", async () => {
      // Create file
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "initial content",
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      const midTimestamp = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Modify file
      await repository.recordHistory({
        action: "modified",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "modified content",
      });

      // Get state at mid point (should have initial content)
      const state = await repository.getStateAtTime("test-project", midTimestamp);

      expect(state.files.size).toBe(1);
      expect(state.files.get("test-file.md")).toBe("initial content");
    });

    it("should exclude deleted files from state", async () => {
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "content",
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await repository.recordHistory({
        action: "deleted",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "content",
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      const afterDelete = new Date().toISOString();

      const state = await repository.getStateAtTime("test-project", afterDelete);
      expect(state.files.size).toBe(0);
    });

    it("should handle file recreation after deletion", async () => {
      // Create
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "original content",
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Delete
      await repository.recordHistory({
        action: "deleted",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "original content",
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Recreate
      await repository.recordHistory({
        action: "created",
        actor: "actor1",
        projectName: "test-project",
        fileName: "test-file.md",
        content: "new content",
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      const finalTimestamp = new Date().toISOString();

      const state = await repository.getStateAtTime("test-project", finalTimestamp);
      expect(state.files.size).toBe(1);
      expect(state.files.get("test-file.md")).toBe("new content");
    });
  });
});
