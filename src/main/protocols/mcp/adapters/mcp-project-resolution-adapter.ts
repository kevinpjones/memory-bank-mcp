import {
  Request as MCPRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { ProjectNameResolverService } from "../../../../data/services/project-name-resolver.js";
import { MetadataRepository } from "../../../../data/protocols/metadata-repository.js";
import { ProjectIndexRepository } from "../../../../data/protocols/project-index-repository.js";
import { MCPRequestHandler, ToolResponse } from "./mcp-router-adapter.js";

export type ResolutionMode = "read" | "write";

/**
 * Wraps an MCP request handler to resolve friendly project names to directory names.
 *
 * - "read" mode: resolves projectName to an existing directory name before calling the handler.
 *   If resolution fails, passes through the original name (lets downstream handle the error).
 * - "write" mode: resolves for creation (normalizes if new), calls the handler,
 *   then writes metadata and updates the index for newly created projects.
 */
export function withProjectResolution(
  handlerPromise: Promise<MCPRequestHandler>,
  resolver: ProjectNameResolverService,
  metadataRepo: MetadataRepository,
  indexRepo: ProjectIndexRepository,
  mode: ResolutionMode
): Promise<MCPRequestHandler> {
  return handlerPromise.then((handler) => {
    return async (request: MCPRequest) => {
      const args = (request.params?.arguments ?? {}) as Record<
        string,
        unknown
      >;

      if (!args.projectName || typeof args.projectName !== "string") {
        return handler(request);
      }

      const originalName = args.projectName;

      if (mode === "write") {
        return handleWriteMode(
          request,
          handler,
          args,
          originalName,
          resolver,
          metadataRepo,
          indexRepo
        );
      }

      return handleReadMode(request, handler, args, originalName, resolver, metadataRepo, indexRepo);
    };
  });
}

async function handleWriteMode(
  request: MCPRequest,
  handler: MCPRequestHandler,
  args: Record<string, unknown>,
  originalName: string,
  resolver: ProjectNameResolverService,
  metadataRepo: MetadataRepository,
  indexRepo: ProjectIndexRepository
) {
  const result = await resolver.resolveForCreation(originalName);

  const modifiedRequest = createModifiedRequest(
    request,
    args,
    result.directoryName
  );
  const response = await handler(modifiedRequest);
  const toolResponse = response as ToolResponse;

  // After successful write of a new project, write metadata and update index
  if (result.isNew && !toolResponse.isError) {
    try {
      await metadataRepo.writeMetadata(result.directoryName, {
        friendlyName: result.friendlyName,
        directoryName: result.directoryName,
        createdAt: new Date().toISOString(),
      });
      await indexRepo.setMapping(result.friendlyName, result.directoryName);
    } catch {
      // Metadata/index write failure should not fail the main operation
    }
  }

  return response;
}

async function handleReadMode(
  request: MCPRequest,
  handler: MCPRequestHandler,
  args: Record<string, unknown>,
  originalName: string,
  resolver: ProjectNameResolverService,
  metadataRepo?: MetadataRepository,
  indexRepo?: ProjectIndexRepository
) {
  const resolved = await resolver.resolve(originalName);

  // Lazy metadata creation: if this project exists but has no metadata,
  // backfill it with directoryName as friendlyName for gradual migration.
  if (resolved && metadataRepo && indexRepo) {
    ensureLazyMetadata(resolved, metadataRepo, indexRepo);
  }

  if (resolved && resolved !== originalName) {
    const modifiedRequest = createModifiedRequest(request, args, resolved);
    return handler(modifiedRequest);
  }

  return handler(request);
}

/**
 * Fire-and-forget: creates metadata for a project that doesn't have any yet.
 * Does not block the request or propagate errors.
 */
function ensureLazyMetadata(
  directoryName: string,
  metadataRepo: MetadataRepository,
  indexRepo: ProjectIndexRepository
): void {
  // Run asynchronously without blocking
  (async () => {
    try {
      const existing = await metadataRepo.readMetadata(directoryName);
      if (existing !== null) {
        return; // Already has metadata
      }
      const metadata = {
        friendlyName: directoryName,
        directoryName,
        createdAt: new Date().toISOString(),
      };
      await metadataRepo.writeMetadata(directoryName, metadata);
      await indexRepo.setMapping(directoryName, directoryName);
    } catch {
      // Swallow errors — lazy backfill is best-effort
    }
  })();
}

function createModifiedRequest(
  request: MCPRequest,
  args: Record<string, unknown>,
  resolvedProjectName: string
): MCPRequest {
  return {
    ...request,
    params: {
      ...request.params,
      arguments: { ...args, projectName: resolvedProjectName },
    },
  } as MCPRequest;
}
