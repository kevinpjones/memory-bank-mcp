import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FsMetadataRepository } from "../../../../src/infra/filesystem/repositories/fs-metadata-repository.js";
import { ProjectMetadata } from "../../../../src/domain/entities/index.js";

describe("FsMetadataRepository", () => {
  let tempDir: string;
  let repository: FsMetadataRepository;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "memory-bank-meta-test-"));
    repository = new FsMetadataRepository(tempDir);
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  const sampleMetadata: ProjectMetadata = {
    friendlyName: "My Cool Project",
    directoryName: "my-cool-project",
    createdAt: "2026-01-15T10:30:00.000Z",
  };

  describe("readMetadata", () => {
    it("should return null when project directory does not exist", async () => {
      const result = await repository.readMetadata("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null when .metadata.json does not exist", async () => {
      await fs.mkdir(path.join(tempDir, "my-project"));
      const result = await repository.readMetadata("my-project");
      expect(result).toBeNull();
    });

    it("should return null when .metadata.json is invalid JSON", async () => {
      const projectDir = path.join(tempDir, "my-project");
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, ".metadata.json"),
        "not valid json"
      );
      const result = await repository.readMetadata("my-project");
      expect(result).toBeNull();
    });

    it("should return null when .metadata.json is missing required fields", async () => {
      const projectDir = path.join(tempDir, "my-project");
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, ".metadata.json"),
        JSON.stringify({ friendlyName: "test" })
      );
      const result = await repository.readMetadata("my-project");
      expect(result).toBeNull();
    });

    it("should return metadata when .metadata.json is valid", async () => {
      const projectDir = path.join(tempDir, "my-cool-project");
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, ".metadata.json"),
        JSON.stringify(sampleMetadata)
      );

      const result = await repository.readMetadata("my-cool-project");
      expect(result).toEqual(sampleMetadata);
    });

    it("should ignore extra fields in .metadata.json", async () => {
      const projectDir = path.join(tempDir, "my-project");
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, ".metadata.json"),
        JSON.stringify({
          ...sampleMetadata,
          extraField: "should be ignored",
          tags: ["a", "b"],
        })
      );

      const result = await repository.readMetadata("my-project");
      expect(result).toEqual(sampleMetadata);
    });
  });

  describe("writeMetadata", () => {
    it("should create .metadata.json in the project directory", async () => {
      const projectDir = path.join(tempDir, "my-cool-project");
      await fs.mkdir(projectDir);

      await repository.writeMetadata("my-cool-project", sampleMetadata);

      const metadataPath = path.join(projectDir, ".metadata.json");
      const exists = await fs.pathExists(metadataPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(metadataPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(sampleMetadata);
    });

    it("should overwrite existing .metadata.json", async () => {
      const projectDir = path.join(tempDir, "my-project");
      await fs.mkdir(projectDir);

      const initialMetadata: ProjectMetadata = {
        friendlyName: "Old Name",
        directoryName: "my-project",
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      await repository.writeMetadata("my-project", initialMetadata);

      const updatedMetadata: ProjectMetadata = {
        friendlyName: "New Name",
        directoryName: "my-project",
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      await repository.writeMetadata("my-project", updatedMetadata);

      const result = await repository.readMetadata("my-project");
      expect(result).toEqual(updatedMetadata);
    });

    it("should produce valid JSON that can be read back", async () => {
      const projectDir = path.join(tempDir, "my-cool-project");
      await fs.mkdir(projectDir);

      await repository.writeMetadata("my-cool-project", sampleMetadata);
      const result = await repository.readMetadata("my-cool-project");
      expect(result).toEqual(sampleMetadata);
    });
  });
});
