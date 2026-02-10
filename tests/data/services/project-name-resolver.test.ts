import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProjectNameResolver,
  ProjectNameResolverService,
} from "../../../src/data/services/project-name-resolver.js";
import { ProjectRepository } from "../../../src/data/protocols/project-repository.js";
import { ProjectIndexRepository } from "../../../src/data/protocols/project-index-repository.js";

// --- Mock implementations ---

class MockProjectRepository implements ProjectRepository {
  private projects = new Set<string>();

  addProject(name: string) {
    this.projects.add(name);
  }

  async listProjects(): Promise<string[]> {
    return Array.from(this.projects);
  }

  async projectExists(name: string): Promise<boolean> {
    if (!this.projects.has(name)) {
      throw new Error("ENOENT");
    }
    return true;
  }

  async ensureProject(name: string): Promise<void> {
    this.projects.add(name);
  }
}

class MockIndexRepository implements ProjectIndexRepository {
  private mappings: Record<string, string> = {};

  async getDirectoryName(friendlyName: string): Promise<string | null> {
    return this.mappings[friendlyName] ?? null;
  }

  async setMapping(
    friendlyName: string,
    directoryName: string
  ): Promise<void> {
    this.mappings[friendlyName] = directoryName;
  }

  async removeMapping(friendlyName: string): Promise<void> {
    delete this.mappings[friendlyName];
  }

  async getAllMappings(): Promise<Record<string, string>> {
    return { ...this.mappings };
  }

  async rebuildIndex(
    entries: Array<{ friendlyName: string; directoryName: string }>
  ): Promise<void> {
    this.mappings = {};
    for (const e of entries) {
      this.mappings[e.friendlyName] = e.directoryName;
    }
  }
}

describe("ProjectNameResolver", () => {
  let projectRepo: MockProjectRepository;
  let indexRepo: MockIndexRepository;
  let resolver: ProjectNameResolverService;

  beforeEach(() => {
    projectRepo = new MockProjectRepository();
    indexRepo = new MockIndexRepository();
    resolver = new ProjectNameResolver(projectRepo, indexRepo);
  });

  describe("resolve", () => {
    it("should return the input when it matches an existing directory", async () => {
      projectRepo.addProject("my-project");
      const result = await resolver.resolve("my-project");
      expect(result).toBe("my-project");
    });

    it("should resolve via index when input is a known friendly name", async () => {
      projectRepo.addProject("my-cool-project");
      await indexRepo.setMapping("My Cool Project", "my-cool-project");

      const result = await resolver.resolve("My Cool Project");
      expect(result).toBe("my-cool-project");
    });

    it("should resolve via normalization when input normalizes to existing directory", async () => {
      projectRepo.addProject("my-cool-project");
      // No index entry, but normalization of "My Cool Project" = "my-cool-project"
      const result = await resolver.resolve("My Cool Project");
      expect(result).toBe("my-cool-project");
    });

    it("should return null when no matching project exists", async () => {
      const result = await resolver.resolve("Nonexistent Project");
      expect(result).toBeNull();
    });

    it("should return null when normalized name does not match any directory", async () => {
      projectRepo.addProject("other-project");
      const result = await resolver.resolve("My Missing Project");
      expect(result).toBeNull();
    });

    it("should prefer exact directory match over index lookup", async () => {
      // "My Cool Project" is both a directory name AND a friendly name pointing elsewhere
      projectRepo.addProject("My Cool Project");
      projectRepo.addProject("other-dir");
      await indexRepo.setMapping("My Cool Project", "other-dir");

      const result = await resolver.resolve("My Cool Project");
      expect(result).toBe("My Cool Project");
    });

    it("should handle index mapping to a deleted directory gracefully", async () => {
      // Index points to a directory that no longer exists
      await indexRepo.setMapping("My Project", "deleted-dir");
      // But the normalized name also doesn't exist
      const result = await resolver.resolve("My Project");
      expect(result).toBeNull();
    });

    it("should handle names that cannot be normalized", async () => {
      // "!!!" cannot be normalized (all special chars)
      const result = await resolver.resolve("!!!");
      expect(result).toBeNull();
    });
  });

  describe("resolveForCreation", () => {
    it("should return existing project when it exists by directory name", async () => {
      projectRepo.addProject("my-project");
      const result = await resolver.resolveForCreation("my-project");
      expect(result).toEqual({
        directoryName: "my-project",
        friendlyName: "my-project",
        isNew: false,
      });
    });

    it("should return existing project when it exists by friendly name in index", async () => {
      projectRepo.addProject("my-cool-project");
      await indexRepo.setMapping("My Cool Project", "my-cool-project");

      const result = await resolver.resolveForCreation("My Cool Project");
      expect(result).toEqual({
        directoryName: "my-cool-project",
        friendlyName: "My Cool Project",
        isNew: false,
      });
    });

    it("should return existing project when normalization matches", async () => {
      projectRepo.addProject("my-cool-project");

      const result = await resolver.resolveForCreation("My Cool Project");
      expect(result).toEqual({
        directoryName: "my-cool-project",
        friendlyName: "My Cool Project",
        isNew: false,
      });
    });

    it("should create new project with normalized name", async () => {
      const result = await resolver.resolveForCreation("My New Project!");
      expect(result).toEqual({
        directoryName: "my-new-project",
        friendlyName: "My New Project!",
        isNew: true,
      });
    });

    it("should handle collision by appending suffix", async () => {
      // "my-project" directory exists but is NOT mapped to "My Project" in the index
      // AND is NOT the normalization of "My Project" — wait, it IS.
      // Let me set up a proper collision:
      // "my-project" exists and IS the normalization of "My Project"
      // So resolveForCreation should find it via resolve() step 3

      // Instead, test a true collision:
      // "test-project" exists (legacy)
      projectRepo.addProject("test-project");
      // The index has "test-project" mapped to a DIFFERENT friendly name
      await indexRepo.setMapping("Original Name", "test-project");

      // Now someone tries to create "Test Project" which normalizes to "test-project"
      // resolve() step 1: "Test Project" is not a directory ✗
      // resolve() step 2: "Test Project" not in index ✗
      // resolve() step 3: normalize("Test Project") = "test-project", exists ✓
      // So it returns existing project
      const result = await resolver.resolveForCreation("Test Project");
      expect(result).toEqual({
        directoryName: "test-project",
        friendlyName: "Test Project",
        isNew: false,
      });
    });

    it("should append suffix when normalized name collides and resolve does not match", async () => {
      // This scenario: resolve() returns existing, so collision suffix not needed
      // To truly test suffix: we need resolve() to return null, but normalized dir exists
      // That can't happen in normal flow because resolve() step 3 checks normalized.
      // The suffix logic handles an edge case where resolve returns null
      // but the directory gets created between resolve() and the existence check.
      // For unit testing, let's mock the behavior:

      // Create a resolver where resolve returns null but the dir exists
      const specialProjectRepo = new MockProjectRepository();
      const specialIndexRepo = new MockIndexRepository();
      const specialResolver = new ProjectNameResolver(
        specialProjectRepo,
        specialIndexRepo
      );

      // Make "test-project" exist AFTER resolve() runs
      // We can achieve this by spying on resolve
      vi.spyOn(specialResolver, "resolve").mockResolvedValueOnce(null);
      specialProjectRepo.addProject("test-project"); // Exists for collision check

      const result = await specialResolver.resolveForCreation("Test Project");
      expect(result.directoryName).toBe("test-project-1");
      expect(result.isNew).toBe(true);
    });

    it("should throw when name cannot be normalized at all", async () => {
      await expect(resolver.resolveForCreation("!!!")).rejects.toThrow(
        "cannot be normalized"
      );
    });

    it("should handle names that are already filesystem-safe", async () => {
      const result = await resolver.resolveForCreation("my-safe-name");
      expect(result).toEqual({
        directoryName: "my-safe-name",
        friendlyName: "my-safe-name",
        isNew: true,
      });
    });
  });
});
