/**
 * Service interface for acquiring and releasing locks.
 * Used to prevent race conditions in concurrent operations.
 */
export interface LockService {
  /**
   * Acquires a lock for the specified key.
   * If the lock is already held, waits until it becomes available.
   * @param key The key to lock (e.g., project name)
   * @returns A release function that must be called when the operation completes
   */
  acquireLock(key: string): Promise<() => Promise<void>>;
}
