import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { FileLockService } from "../../../../src/infra/filesystem/services/file-lock-service.js";

describe("FileLockService", () => {
  let testDir: string;
  let lockService: FileLockService;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "lock-test-"));
    lockService = new FileLockService(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("acquireLock", () => {
    it("should create locks directory if it doesn't exist", async () => {
      const release = await lockService.acquireLock("test-key");
      
      const locksDir = path.join(testDir, ".locks");
      expect(await fs.pathExists(locksDir)).toBe(true);
      
      await release();
    });

    it("should create lock file for the key", async () => {
      const release = await lockService.acquireLock("test-key");
      
      const lockFile = path.join(testDir, ".locks", "test-key.lock");
      expect(await fs.pathExists(lockFile)).toBe(true);
      
      await release();
    });

    it("should sanitize key to create valid filename", async () => {
      const release = await lockService.acquireLock("project/with/slashes");
      
      const lockFile = path.join(testDir, ".locks", "project_with_slashes.lock");
      expect(await fs.pathExists(lockFile)).toBe(true);
      
      await release();
    });

    it("should allow acquiring and releasing lock multiple times", async () => {
      const release1 = await lockService.acquireLock("test-key");
      await release1();

      const release2 = await lockService.acquireLock("test-key");
      await release2();

      const release3 = await lockService.acquireLock("test-key");
      await release3();
    });

    it("should allow acquiring locks for different keys concurrently", async () => {
      const release1 = await lockService.acquireLock("key-1");
      const release2 = await lockService.acquireLock("key-2");
      const release3 = await lockService.acquireLock("key-3");

      // All locks should be acquired without blocking
      expect(release1).toBeDefined();
      expect(release2).toBeDefined();
      expect(release3).toBeDefined();

      await release1();
      await release2();
      await release3();
    });

    it("should serialize concurrent lock requests for the same key", async () => {
      const executionOrder: number[] = [];
      
      // Acquire first lock
      const release1 = await lockService.acquireLock("shared-key");
      
      // Start second lock acquisition (will wait)
      const lock2Promise = lockService.acquireLock("shared-key").then(async (release) => {
        executionOrder.push(2);
        await release();
      });

      // Start third lock acquisition (will wait)
      const lock3Promise = lockService.acquireLock("shared-key").then(async (release) => {
        executionOrder.push(3);
        await release();
      });

      // Small delay to ensure lock attempts are queued
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Release first lock
      executionOrder.push(1);
      await release1();

      // Wait for all locks to complete
      await Promise.all([lock2Promise, lock3Promise]);

      // First lock should complete before others
      expect(executionOrder[0]).toBe(1);
      // Subsequent locks should complete in order
      expect(executionOrder).toContain(2);
      expect(executionOrder).toContain(3);
    });

    it("should prevent race conditions in concurrent operations", async () => {
      let sharedCounter = 0;
      const iterations = 10;
      
      const incrementWithLock = async () => {
        const release = await lockService.acquireLock("counter-key");
        try {
          // Simulate read-modify-write with a small delay
          const current = sharedCounter;
          await new Promise(resolve => setTimeout(resolve, 10));
          sharedCounter = current + 1;
        } finally {
          await release();
        }
      };

      // Run multiple increments concurrently
      await Promise.all(
        Array(iterations).fill(null).map(() => incrementWithLock())
      );

      // With proper locking, counter should equal iterations
      expect(sharedCounter).toBe(iterations);
    });

    it("should handle lock release even if operation throws", async () => {
      const release = await lockService.acquireLock("error-key");
      
      try {
        throw new Error("Simulated error");
      } catch {
        // Error caught
      } finally {
        await release();
      }

      // Should be able to acquire lock again after error
      const release2 = await lockService.acquireLock("error-key");
      expect(release2).toBeDefined();
      await release2();
    });
  });

  describe("edge cases", () => {
    it("should handle empty key", async () => {
      const release = await lockService.acquireLock("");
      
      const lockFile = path.join(testDir, ".locks", ".lock");
      expect(await fs.pathExists(lockFile)).toBe(true);
      
      await release();
    });

    it("should handle key with special characters", async () => {
      const release = await lockService.acquireLock("key@with#special$chars!");
      
      const lockFile = path.join(testDir, ".locks", "key_with_special_chars_.lock");
      expect(await fs.pathExists(lockFile)).toBe(true);
      
      await release();
    });

    it("should handle very long key names", async () => {
      const longKey = "a".repeat(200);
      const release = await lockService.acquireLock(longKey);
      
      expect(release).toBeDefined();
      
      await release();
    });
  });
});
