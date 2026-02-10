import { ProjectIndexRepository } from "../protocols/project-index-repository.js";
import { ProjectRepository } from "../protocols/project-repository.js";
import { normalizeProjectName } from "../helpers/normalize-project-name.js";

/**
 * Result of resolving a project name for creation.
 */
export interface ResolveForCreationResult {
  /** The filesystem-safe directory name */
  directoryName: string;
  /** The original friendly name provided by the user */
  friendlyName: string;
  /** Whether this is a new project (true) or an existing one (false) */
  isNew: boolean;
}

/**
 * Protocol interface for the ProjectNameResolver service.
 */
export interface ProjectNameResolverService {
  /**
   * Resolves a user-provided project name to an existing directory name.
   * Checks: exact directory match -> index lookup -> normalized name match.
   * @returns The directory name, or null if no matching project exists.
   */
  resolve(input: string): Promise<string | null>;

  /**
   * Resolves a project name for creation.
   * If the project already exists, returns the existing directory name.
   * If new, normalizes the name and handles collisions.
   */
  resolveForCreation(input: string): Promise<ResolveForCreationResult>;
}

/**
 * Service that resolves user-provided project names (which may be friendly
 * names with spaces/special chars) to filesystem-safe directory names.
 */
export class ProjectNameResolver implements ProjectNameResolverService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly indexRepository: ProjectIndexRepository
  ) {}

  async resolve(input: string): Promise<string | null> {
    // 1. Check if input is an existing directory name directly
    if (await this.directoryExists(input)) {
      return input;
    }

    // 2. Check index for input as a friendly name
    const mappedDir = await this.indexRepository.getDirectoryName(input);
    if (mappedDir !== null && (await this.directoryExists(mappedDir))) {
      return mappedDir;
    }

    // 3. Try normalizing input and check if that directory exists
    try {
      const normalized = normalizeProjectName(input);
      if (normalized !== input && (await this.directoryExists(normalized))) {
        return normalized;
      }
    } catch {
      // Normalization failed (e.g., empty result) — project doesn't exist
    }

    return null;
  }

  async resolveForCreation(input: string): Promise<ResolveForCreationResult> {
    // 1. Try to resolve to an existing project
    const existing = await this.resolve(input);
    if (existing !== null) {
      return {
        directoryName: existing,
        friendlyName: input,
        isNew: false,
      };
    }

    // 2. Normalize for a new project
    const candidate = normalizeProjectName(input);

    // 3. Handle collisions: if candidate directory exists (unmapped legacy project),
    //    append incrementing suffix
    let finalName = candidate;
    let suffix = 1;
    while (await this.directoryExists(finalName)) {
      finalName = `${candidate}-${suffix}`;
      suffix++;
    }

    return {
      directoryName: finalName,
      friendlyName: input,
      isNew: true,
    };
  }

  /**
   * Checks if a directory exists, swallowing errors (stat throws on non-existent).
   */
  private async directoryExists(name: string): Promise<boolean> {
    try {
      return await this.projectRepository.projectExists(name);
    } catch {
      return false;
    }
  }
}
