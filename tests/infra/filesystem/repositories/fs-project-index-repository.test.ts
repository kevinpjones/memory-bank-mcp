import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FsProjectIndexRepository } from "../../../../src/infra/filesystem/repositories/fs-project-index-repository.js";
import { FileLockService } from "../../../../src/infra/filesystem/services/file-lock-service.js";

describe("FsProjectIndexRepository", () => {
  let tempDir: string;
  let repository: FsProjectIndexRepository;
  let lockService: FileLockService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "memory-bank-index-test-"));
    lockService = new FileLockService(tempDir);
    repository = new FsProjectIndexRepository(tempDir, lockService);
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  describe("getDirectoryName", () => {
    it("should return null when index file does not exist", async () => {
      const result = await repository.getDirectoryName("My Project");
      expect(result).toBeNull();
    });

    it("should return null when friendly name is not in index", async () => {
      await repository.setMapping("Other Project", "other-project");
      const result = await repository.getDirectoryName("My Project");
      expect(result).toBeNull();
    });

    it("should return directory name for a known friendly name", async () => {
      await repository.setMapping("My Cool Project", "my-cool-project");
      const result = await repository.getDirectoryName("My Cool Project");
      expect(result).toBe("my-cool-project");
    });
  });

  describe("setMapping", () => {
    it("should create index file if it does not exist", async () => {
      await repository.setMapping("My Project", "my-project");
      const indexPath = path.join(tempDir, ".index");
      const exists = await fs.pathExists(indexPath);
      expect(exists).toBe(true);
    });

    it("should store a mapping that can be retrieved", async () => {
      await repository.setMapping("Test Project", "test-project");
      const result = await repository.getDirectoryName("Test Project");
      expect(result).toBe("test-project");
    });

    it("should add multiple mappings", async () => {
      await repository.setMapping("Project A", "project-a");
      await repository.setMapping("Project B", "project-b");

      expect(await repository.getDirectoryName("Project A")).toBe("project-a");
      expect(await repository.getDirectoryName("Project B")).toBe("project-b");
    });

    it("should overwrite existing mapping for same friendly name", async () => {
      await repository.setMapping("My Project", "my-project-v1");
      await repository.setMapping("My Project", "my-project-v2");

      const result = await repository.getDirectoryName("My Project");
      expect(result).toBe("my-project-v2");
    });
  });

  describe("removeMapping", () => {
    it("should remove an existing mapping", async () => {
      await repository.setMapping("My Project", "my-project");
      await repository.removeMapping("My Project");

      const result = await repository.getDirectoryName("My Project");
      expect(result).toBeNull();
    });

    it("should not throw when removing a non-existent mapping", async () => {
      await expect(
        repository.removeMapping("nonexistent")
      ).resolves.not.toThrow();
    });

    it("should not affect other mappings", async () => {
      await repository.setMapping("Project A", "project-a");
      await repository.setMapping("Project B", "project-b");
      await repository.removeMapping("Project A");

      expect(await repository.getDirectoryName("Project A")).toBeNull();
      expect(await repository.getDirectoryName("Project B")).toBe("project-b");
    });
  });

  describe("getAllMappings", () => {
    it("should return empty object when no mappings exist", async () => {
      const result = await repository.getAllMappings();
      expect(result).toEqual({});
    });

    it("should return all stored mappings", async () => {
      await repository.setMapping("Project A", "project-a");
      await repository.setMapping("Project B", "project-b");

      const result = await repository.getAllMappings();
      expect(result).toEqual({
        "Project A": "project-a",
        "Project B": "project-b",
      });
    });

    it("should return a copy that does not affect internal state", async () => {
      await repository.setMapping("My Project", "my-project");
      const result = await repository.getAllMappings();
      result["Injected"] = "injected";

      const fresh = await repository.getAllMappings();
      expect(fresh).not.toHaveProperty("Injected");
    });
  });

  describe("rebuildIndex", () => {
    it("should replace all existing mappings", async () => {
      await repository.setMapping("Old Project", "old-project");

      await repository.rebuildIndex([
        { friendlyName: "New A", directoryName: "new-a" },
        { friendlyName: "New B", directoryName: "new-b" },
      ]);

      expect(await repository.getDirectoryName("Old Project")).toBeNull();
      expect(await repository.getDirectoryName("New A")).toBe("new-a");
      expect(await repository.getDirectoryName("New B")).toBe("new-b");
    });

    it("should handle empty entries array", async () => {
      await repository.setMapping("My Project", "my-project");
      await repository.rebuildIndex([]);

      const mappings = await repository.getAllMappings();
      expect(mappings).toEqual({});
    });
  });

  describe("corrupt index recovery", () => {
    it("should return empty mappings when index file is invalid JSON", async () => {
      await fs.writeFile(path.join(tempDir, ".index"), "not valid json");
      const result = await repository.getAllMappings();
      expect(result).toEqual({});
    });

    it("should return empty mappings when index has wrong structure", async () => {
      await fs.writeFile(
        path.join(tempDir, ".index"),
        JSON.stringify({ version: 1, wrong: "structure" })
      );
      const result = await repository.getAllMappings();
      expect(result).toEqual({});
    });

    it("should be recoverable by writing new mappings after corruption", async () => {
      await fs.writeFile(path.join(tempDir, ".index"), "corrupt");
      await repository.setMapping("My Project", "my-project");
      expect(await repository.getDirectoryName("My Project")).toBe(
        "my-project"
      );
    });
  });

  describe("index file format", () => {
    it("should write valid JSON with version and mappings", async () => {
      await repository.setMapping("My Project", "my-project");

      const content = await fs.readFile(
        path.join(tempDir, ".index"),
        "utf-8"
      );
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe(1);
      expect(parsed.mappings).toEqual({ "My Project": "my-project" });
    });
  });
});
