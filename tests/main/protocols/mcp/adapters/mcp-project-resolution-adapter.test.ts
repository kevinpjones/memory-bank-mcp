import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  Request as MCPRequest,
  ServerResult as MCPResponse,
} from "@modelcontextprotocol/sdk/types.js";
import {
  withProjectResolution,
  ResolutionMode,
} from "../../../../../src/main/protocols/mcp/adapters/mcp-project-resolution-adapter.js";
import { ProjectNameResolverService } from "../../../../../src/data/services/project-name-resolver.js";
import { MetadataRepository } from "../../../../../src/data/protocols/metadata-repository.js";
import { ProjectIndexRepository } from "../../../../../src/data/protocols/project-index-repository.js";
import { ProjectMetadata } from "../../../../../src/domain/entities/index.js";

// --- Mock factories ---

const makeResolver = (): ProjectNameResolverService => ({
  resolve: vi.fn().mockResolvedValue(null),
  resolveForCreation: vi.fn().mockResolvedValue({
    directoryName: "resolved-dir",
    friendlyName: "Original Name",
    isNew: true,
  }),
});

const makeMetadataRepo = (): MetadataRepository => ({
  readMetadata: vi.fn().mockResolvedValue(null),
  writeMetadata: vi.fn().mockResolvedValue(undefined),
});

const makeIndexRepo = (): ProjectIndexRepository => ({
  getDirectoryName: vi.fn().mockResolvedValue(null),
  setMapping: vi.fn().mockResolvedValue(undefined),
  removeMapping: vi.fn().mockResolvedValue(undefined),
  getAllMappings: vi.fn().mockResolvedValue({}),
  rebuildIndex: vi.fn().mockResolvedValue(undefined),
});

const makeRequest = (
  projectName?: string,
  extra?: Record<string, unknown>
): MCPRequest => ({
  method: "tools/call",
  params: {
    name: "test_tool",
    arguments: { ...(projectName !== undefined ? { projectName } : {}), ...extra },
  },
});

const makeSuccessResponse = (): MCPResponse => ({
  content: [{ type: "text", text: "ok" }],
  isError: false,
});

const makeErrorResponse = (): MCPResponse => ({
  content: [{ type: "text", text: "error" }],
  isError: true,
});

describe("withProjectResolution", () => {
  let resolver: ProjectNameResolverService;
  let metadataRepo: MetadataRepository;
  let indexRepo: ProjectIndexRepository;

  beforeEach(() => {
    resolver = makeResolver();
    metadataRepo = makeMetadataRepo();
    indexRepo = makeIndexRepo();
  });

  describe("read mode", () => {
    it("should pass through when no projectName in arguments", async () => {
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());
      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      const request = makeRequest();
      delete (request.params as any).arguments.projectName;
      await handler(request);

      expect(resolver.resolve).not.toHaveBeenCalled();
      expect(innerHandler).toHaveBeenCalledWith(request);
    });

    it("should resolve friendly name to directory name", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue("resolved-project");
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      await handler(makeRequest("My Project"));

      expect(resolver.resolve).toHaveBeenCalledWith("My Project");
      const calledWith = innerHandler.mock.calls[0][0];
      expect(calledWith.params.arguments.projectName).toBe("resolved-project");
    });

    it("should pass through original name when resolution returns null", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue(null);
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      const request = makeRequest("unknown-project");
      await handler(request);

      expect(innerHandler).toHaveBeenCalledWith(request);
    });

    it("should pass through when resolved name equals original name", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue("my-project");
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      const request = makeRequest("my-project");
      await handler(request);

      // Should pass the original request since names match
      expect(innerHandler).toHaveBeenCalledWith(request);
    });

    it("should preserve other arguments when resolving", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue("resolved-dir");
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      await handler(makeRequest("My Project", { fileName: "test.md" }));

      const calledWith = innerHandler.mock.calls[0][0];
      expect(calledWith.params.arguments.projectName).toBe("resolved-dir");
      expect(calledWith.params.arguments.fileName).toBe("test.md");
    });

    it("should lazily backfill metadata for projects without it in read mode", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue("resolved-dir");
      vi.mocked(metadataRepo.readMetadata).mockResolvedValue(null); // No existing metadata
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      await handler(makeRequest("My Project"));

      // Allow fire-and-forget promises to settle
      await new Promise((r) => setTimeout(r, 50));

      // Lazy backfill should have written metadata using directory name as friendly name
      expect(metadataRepo.writeMetadata).toHaveBeenCalledWith(
        "resolved-dir",
        expect.objectContaining({
          friendlyName: "resolved-dir",
          directoryName: "resolved-dir",
        })
      );
      expect(indexRepo.setMapping).toHaveBeenCalledWith(
        "resolved-dir",
        "resolved-dir"
      );
    });

    it("should NOT backfill metadata if it already exists", async () => {
      vi.mocked(resolver.resolve).mockResolvedValue("resolved-dir");
      vi.mocked(metadataRepo.readMetadata).mockResolvedValue({
        friendlyName: "Existing Name",
        directoryName: "resolved-dir",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "read"
      );

      await handler(makeRequest("My Project"));

      // Allow fire-and-forget promises to settle
      await new Promise((r) => setTimeout(r, 50));

      expect(metadataRepo.writeMetadata).not.toHaveBeenCalled();
      expect(indexRepo.setMapping).not.toHaveBeenCalled();
    });
  });

  describe("write mode", () => {
    it("should resolve for creation", async () => {
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      await handler(makeRequest("My New Project"));

      expect(resolver.resolveForCreation).toHaveBeenCalledWith(
        "My New Project"
      );
    });

    it("should use resolved directory name in the handler call", async () => {
      vi.mocked(resolver.resolveForCreation).mockResolvedValue({
        directoryName: "my-new-project",
        friendlyName: "My New Project",
        isNew: true,
      });
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      await handler(makeRequest("My New Project"));

      const calledWith = innerHandler.mock.calls[0][0];
      expect(calledWith.params.arguments.projectName).toBe("my-new-project");
    });

    it("should write metadata and update index for new projects on success", async () => {
      vi.mocked(resolver.resolveForCreation).mockResolvedValue({
        directoryName: "my-new-project",
        friendlyName: "My New Project",
        isNew: true,
      });
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      await handler(makeRequest("My New Project"));

      expect(metadataRepo.writeMetadata).toHaveBeenCalledWith(
        "my-new-project",
        expect.objectContaining({
          friendlyName: "My New Project",
          directoryName: "my-new-project",
          createdAt: expect.any(String),
        })
      );
      expect(indexRepo.setMapping).toHaveBeenCalledWith(
        "My New Project",
        "my-new-project"
      );
    });

    it("should NOT write metadata for existing projects", async () => {
      vi.mocked(resolver.resolveForCreation).mockResolvedValue({
        directoryName: "existing-project",
        friendlyName: "Existing Project",
        isNew: false,
      });
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      await handler(makeRequest("Existing Project"));

      expect(metadataRepo.writeMetadata).not.toHaveBeenCalled();
      expect(indexRepo.setMapping).not.toHaveBeenCalled();
    });

    it("should NOT write metadata when the handler returns an error", async () => {
      vi.mocked(resolver.resolveForCreation).mockResolvedValue({
        directoryName: "my-new-project",
        friendlyName: "My New Project",
        isNew: true,
      });
      const innerHandler = vi.fn().mockResolvedValue(makeErrorResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      await handler(makeRequest("My New Project"));

      expect(metadataRepo.writeMetadata).not.toHaveBeenCalled();
      expect(indexRepo.setMapping).not.toHaveBeenCalled();
    });

    it("should not fail the operation if metadata write throws", async () => {
      vi.mocked(resolver.resolveForCreation).mockResolvedValue({
        directoryName: "my-new-project",
        friendlyName: "My New Project",
        isNew: true,
      });
      vi.mocked(metadataRepo.writeMetadata).mockRejectedValue(
        new Error("write failed")
      );
      const innerHandler = vi.fn().mockResolvedValue(makeSuccessResponse());

      const handler = await withProjectResolution(
        Promise.resolve(innerHandler),
        resolver,
        metadataRepo,
        indexRepo,
        "write"
      );

      const result = await handler(makeRequest("My New Project"));
      // Operation should still succeed despite metadata failure
      expect(result.isError).toBe(false);
    });
  });
});
