import fs from "fs-extra";
import path from "path";
import lockfile from "proper-lockfile";
import { LockService } from "../../../data/protocols/lock-service.js";

/**
 * File-based implementation of the LockService.
 * Uses proper-lockfile for robust cross-process locking.
 * Lock files are stored in a .locks directory within the root directory.
 */
export class FileLockService implements LockService {
  private readonly locksDir: string;

  /**
   * Creates a new FileLockService
   * @param rootDir The root directory where lock files will be stored
   */
  constructor(private readonly rootDir: string) {
    this.locksDir = path.join(rootDir, ".locks");
  }

  /**
   * Gets the path to the lock file for a specific key
   */
  private getLockFilePath(key: string): string {
    // Sanitize the key to create a valid filename
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "_");
    return path.join(this.locksDir, `${sanitizedKey}.lock`);
  }

  /**
   * Acquires a lock for the specified key.
   * Creates a lock file and uses proper-lockfile for atomic locking.
   * @param key The key to lock (e.g., project name)
   * @returns A release function that must be called when the operation completes
   */
  async acquireLock(key: string): Promise<() => Promise<void>> {
    // Ensure locks directory exists
    await fs.ensureDir(this.locksDir);

    const lockFilePath = this.getLockFilePath(key);

    // Ensure the lock file exists (proper-lockfile requires the file to exist)
    await fs.ensureFile(lockFilePath);

    // Acquire the lock with retry options
    const release = await lockfile.lock(lockFilePath, {
      retries: {
        retries: 10,
        factor: 2,
        minTimeout: 100,
        maxTimeout: 1000,
        randomize: true,
      },
      stale: 30000, // Consider lock stale after 30 seconds
    });

    // Return an async release function
    return async () => {
      await release();
    };
  }
}
