import { beforeEach, describe, expect, it, vi } from "vitest";
import { rebuildProjectIndex } from "../../../src/data/services/rebuild-index.js";
import { ProjectRepository } from "../../../src/data/protocols/project-repository.js";
import { MetadataRepository } from "../../../src/data/protocols/metadata-repository.js";
import { ProjectIndexRepository } from "../../../src/data/protocols/project-index-repository.js";
import { ProjectMetadata } from "../../../src/domain/entities/index.js";

// --- Mocks ---

const makeProjectRepo = (projects: string[]): ProjectRepository => ({
  listProjects: vi.fn().mockResolvedValue(projects),
  projectExists: vi.fn().mockResolvedValue(true),
  ensureProject: vi.fn().mockResolvedValue(undefined),
});

const makeMetadataRepo = (
  metadataMap: Record<string, ProjectMetadata | null>
): MetadataRepository => ({
  readMetadata: vi.fn().mockImplementation(async (dirName: string) => {
    return metadataMap[dirName] ?? null;
  }),
  writeMetadata: vi.fn().mockResolvedValue(undefined),
});

const makeIndexRepo = (): ProjectIndexRepository => ({
  getDirectoryName: vi.fn().mockResolvedValue(null),
  setMapping: vi.fn().mockResolvedValue(undefined),
  removeMapping: vi.fn().mockResolvedValue(undefined),
  getAllMappings: vi.fn().mockResolvedValue({}),
  rebuildIndex: vi.fn().mockResolvedValue(undefined),
});

describe("rebuildProjectIndex", () => {
  it("should rebuild index with metadata from all projects", async () => {
    const projectRepo = makeProjectRepo([
      "my-cool-project",
      "another-project",
    ]);
    const metadataRepo = makeMetadataRepo({
      "my-cool-project": {
        friendlyName: "My Cool Project",
        directoryName: "my-cool-project",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      "another-project": {
        friendlyName: "Another Project",
        directoryName: "another-project",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });
    const indexRepo = makeIndexRepo();

    const result = await rebuildProjectIndex(
      projectRepo,
      metadataRepo,
      indexRepo
    );

    expect(result).toEqual({
      total: 2,
      withMetadata: 2,
      withoutMetadata: 0,
    });

    expect(indexRepo.rebuildIndex).toHaveBeenCalledWith([
      {
        friendlyName: "My Cool Project",
        directoryName: "my-cool-project",
      },
      {
        friendlyName: "Another Project",
        directoryName: "another-project",
      },
    ]);
  });

  it("should use directory name as friendly name for projects without metadata", async () => {
    const projectRepo = makeProjectRepo([
      "with-metadata",
      "legacy-project",
    ]);
    const metadataRepo = makeMetadataRepo({
      "with-metadata": {
        friendlyName: "With Metadata",
        directoryName: "with-metadata",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const indexRepo = makeIndexRepo();

    const result = await rebuildProjectIndex(
      projectRepo,
      metadataRepo,
      indexRepo
    );

    expect(result).toEqual({
      total: 2,
      withMetadata: 1,
      withoutMetadata: 1,
    });

    expect(indexRepo.rebuildIndex).toHaveBeenCalledWith([
      {
        friendlyName: "With Metadata",
        directoryName: "with-metadata",
      },
      {
        friendlyName: "legacy-project",
        directoryName: "legacy-project",
      },
    ]);
  });

  it("should handle empty project list", async () => {
    const projectRepo = makeProjectRepo([]);
    const metadataRepo = makeMetadataRepo({});
    const indexRepo = makeIndexRepo();

    const result = await rebuildProjectIndex(
      projectRepo,
      metadataRepo,
      indexRepo
    );

    expect(result).toEqual({
      total: 0,
      withMetadata: 0,
      withoutMetadata: 0,
    });
    expect(indexRepo.rebuildIndex).toHaveBeenCalledWith([]);
  });

  it("should handle metadata read errors gracefully", async () => {
    const projectRepo = makeProjectRepo(["error-project", "ok-project"]);
    const metadataRepo: MetadataRepository = {
      readMetadata: vi.fn().mockImplementation(async (dirName: string) => {
        if (dirName === "error-project") {
          throw new Error("read error");
        }
        return null;
      }),
      writeMetadata: vi.fn(),
    };
    const indexRepo = makeIndexRepo();

    const result = await rebuildProjectIndex(
      projectRepo,
      metadataRepo,
      indexRepo
    );

    expect(result).toEqual({
      total: 2,
      withMetadata: 0,
      withoutMetadata: 2,
    });

    expect(indexRepo.rebuildIndex).toHaveBeenCalledWith([
      { friendlyName: "error-project", directoryName: "error-project" },
      { friendlyName: "ok-project", directoryName: "ok-project" },
    ]);
  });
});
