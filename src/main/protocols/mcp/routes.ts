import {
  makeDeleteController,
  makeListProjectFilesController,
  makeListProjectsController,
  makePatchController,
  makePeekController,
  makeReadController,
  makeUpdateController,
  makeWriteController,
  makeListPromptsController,
  makeGetPromptController,
  makeGetProjectHistoryController,
  makeGetFileAtTimeController,
  makeGetFileHistoryDiffController,
  makeGrepFileController,
  makeGrepProjectController,
} from "../../factories/controllers/index.js";
import { makeMetadataRepository } from "../../factories/repositories/metadata-repository-factory.js";
import { makeProjectIndexRepository } from "../../factories/repositories/project-index-repository-factory.js";
import { makeProjectNameResolver } from "../../factories/services/project-name-resolver-factory.js";
import { adaptMcpRequestHandler } from "./adapters/mcp-request-adapter.js";
import {
  adaptMcpListPromptsHandler,
  adaptMcpGetPromptHandler,
} from "./adapters/mcp-prompt-adapter.js";
import { withProjectResolution } from "./adapters/mcp-project-resolution-adapter.js";
import { McpRouterAdapter, MCPRequestHandler, ToolResponse } from "./adapters/mcp-router-adapter.js";
import { Request as MCPRequest, ServerResult } from "@modelcontextprotocol/sdk/types.js";
import { ProjectInfo } from "../../../domain/entities/index.js";

export default () => {
  const router = new McpRouterAdapter();

  // Create shared resolution dependencies (singletons for this router instance)
  const resolver = makeProjectNameResolver();
  const metadataRepo = makeMetadataRepository();
  const indexRepo = makeProjectIndexRepository();

  /**
   * Helper to wrap a handler with read-mode project name resolution.
   * Resolves friendly names to directory names before calling the controller.
   */
  const withReadResolution = (handler: Promise<ReturnType<typeof adaptMcpRequestHandler> extends Promise<infer R> ? R : never>) =>
    withProjectResolution(handler as any, resolver, metadataRepo, indexRepo, "read");

  /**
   * Helper to wrap a handler with write-mode project name resolution.
   * Resolves + normalizes for creation, writes metadata for new projects.
   */
  const withWriteResolution = (handler: Promise<ReturnType<typeof adaptMcpRequestHandler> extends Promise<infer R> ? R : never>) =>
    withProjectResolution(handler as any, resolver, metadataRepo, indexRepo, "write");

  // ─── Tool endpoints ──────────────────────────────────────────────────

  router.setTool({
    schema: {
      name: "list_projects",
      title: "List Projects",
      description: "List all projects in the memory bank",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: createEnrichedListProjectsHandler(),
  });

  router.setTool({
    schema: {
      name: "list_project_files",
      title: "List Project Files",
      description: "List all files within a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
        },
        required: ["projectName"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeListProjectFilesController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_read",
      title: "Read Memory Bank File",
      description: "Read a memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          includeLineNumbers: {
            type: "boolean",
            description:
              "Whether to include line numbers as metadata prefix in the returned content. When enabled, each line is prefixed with its 1-indexed line number followed by a pipe separator (e.g., '1|first line'). Useful for patch operations. Default: true",
            default: true,
          },
          startLine: {
            type: "integer",
            description:
              "First line to read (1-based indexing). When omitted, reading starts from the beginning of the file.",
          },
          endLine: {
            type: "integer",
            description:
              "Last line to read (1-based indexing, inclusive). When omitted, reading continues to the end of the file.",
          },
          maxLines: {
            type: "integer",
            description:
              "Maximum number of lines to return. When used with startLine, returns up to maxLines starting from startLine. When used alone, returns the first maxLines of the file.",
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeReadController())
    ),
  });

  router.setTool({
    schema: {
      name: "peek_file",
      title: "Peek Memory Bank File",
      description:
        "Quick inspection of a memory bank file. Returns file metadata (total line count) and a preview of the first N lines. Useful for understanding file size and content before reading the full file, preventing context overload with large files.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to peek at",
          },
          previewLines: {
            type: "integer",
            description:
              "Number of lines to include in the preview (default: 10)",
            default: 10,
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makePeekController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_write",
      title: "Write Memory Bank File",
      description: "Create a new memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["projectName", "fileName", "content"],
      },
    },
    handler: withWriteResolution(
      adaptMcpRequestHandler(makeWriteController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_update",
      title: "Update Memory Bank File",
      description:
        "Update an existing memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["projectName", "fileName", "content"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeUpdateController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_delete",
      description:
        "Delete a memory bank file by archiving it with a timestamp",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to delete",
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeDeleteController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_patch",
      title: "Patch Memory Bank File",
      description:
        "Apply a surgical patch to an existing memory bank file. The patch verifies that the content at the specified line range matches the expected oldContent before applying the replacement. This ensures safe, context-aware modifications without requiring full document rewrites.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to patch",
          },
          startLine: {
            type: "integer",
            description:
              "The starting line number (1-based) of the content to replace",
          },
          endLine: {
            type: "integer",
            description:
              "The ending line number (1-based, inclusive) of the content to replace",
          },
          oldContent: {
            type: "string",
            description:
              "The exact content expected at the specified line range (for verification)",
          },
          newContent: {
            type: "string",
            description: "The new content to replace the old content with",
          },
        },
        required: [
          "projectName",
          "fileName",
          "startLine",
          "endLine",
          "oldContent",
          "newContent",
        ],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makePatchController())
    ),
  });

  router.setTool({
    schema: {
      name: "get_project_history",
      title: "Get Project History",
      description:
        "Get the change history for all files in a project. Returns metadata (timestamp, action, actor, fileName) for all historical changes without file content for efficient browsing.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project to get history for",
          },
        },
        required: ["projectName"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeGetProjectHistoryController())
    ),
  });

  router.setTool({
    schema: {
      name: "get_file_at_time",
      title: "Get File At Time",
      description:
        "Retrieve the content of a specific file at a specific point in time. Use this after browsing project history to get the actual content of a file at a particular timestamp.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to retrieve",
          },
          timestamp: {
            type: "string",
            description:
              "ISO 8601 timestamp to get the file content at (e.g., '2024-01-15T10:30:00.000Z')",
          },
        },
        required: ["projectName", "fileName", "timestamp"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeGetFileAtTimeController())
    ),
  });

  router.setTool({
    schema: {
      name: "get_project_file_history_diff",
      title: "Get File History Diff",
      description:
        "Generate a unified diff between two versions of a file. Returns standard unified diff format (similar to git diff) showing additions, deletions, and context lines.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to diff",
          },
          versionFrom: {
            type: "integer",
            description: "Source version number (1-based)",
          },
          versionTo: {
            type: "integer",
            description:
              "Target version number (1-based, optional - defaults to current/latest version)",
          },
        },
        required: ["projectName", "fileName", "versionFrom"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeGetFileHistoryDiffController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_grep_file",
      title: "Grep Memory Bank File",
      description:
        "Search within a single file in a project's memory bank. Returns matches with surrounding context lines. Uses literal string matching (not regex).",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file to search within",
          },
          pattern: {
            type: "string",
            description: "Search pattern (literal string match, not regex)",
          },
          contextLines: {
            type: "integer",
            description:
              "Number of context lines before and after each match (default: 2)",
            default: 2,
          },
          caseSensitive: {
            type: "boolean",
            description:
              "Whether search is case-sensitive (default: true)",
            default: true,
          },
        },
        required: ["projectName", "fileName", "pattern"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeGrepFileController())
    ),
  });

  router.setTool({
    schema: {
      name: "memory_bank_grep_project",
      title: "Grep Memory Bank Project",
      description:
        "Search across all files in a project's memory bank. Returns matches with surrounding context lines, grouped by file. Uses literal string matching (not regex).",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          pattern: {
            type: "string",
            description: "Search pattern (literal string match, not regex)",
          },
          contextLines: {
            type: "integer",
            description:
              "Number of context lines before and after each match (default: 2)",
            default: 2,
          },
          caseSensitive: {
            type: "boolean",
            description:
              "Whether search is case-sensitive (default: true)",
            default: true,
          },
          maxResults: {
            type: "integer",
            description:
              "Maximum number of matches to return across all files (default: 100)",
            default: 100,
          },
        },
        required: ["projectName", "pattern"],
      },
    },
    handler: withReadResolution(
      adaptMcpRequestHandler(makeGrepProjectController())
    ),
  });

  // ─── Prompt endpoints ────────────────────────────────────────────────

  router.setPromptListHandler(
    adaptMcpListPromptsHandler(makeListPromptsController())
  );

  router.setPromptGetHandler(
    adaptMcpGetPromptHandler(makeGetPromptController())
  );

  return router;

  // ─── Internal helpers ────────────────────────────────────────────────

  /**
   * Creates an enriched list_projects handler that returns ProjectInfo objects
   * (with both directory name and friendly name) instead of plain strings.
   */
  function createEnrichedListProjectsHandler(): Promise<MCPRequestHandler> {
    const baseHandler = adaptMcpRequestHandler(makeListProjectsController());

    return baseHandler.then((handler) => {
      return async (request: MCPRequest): Promise<ServerResult> => {
        const response = await handler(request);
        const toolResponse = response as ToolResponse;

        // If error, pass through
        if (toolResponse.isError) {
          return response;
        }

        try {
          // Parse the original response (JSON array of strings)
          const text =
            toolResponse.content?.[0]?.type === "text"
              ? toolResponse.content[0].text
              : null;
          if (!text) return response;

          const projects: string[] = JSON.parse(text);

          // Enrich each project with friendly name from metadata
          const enriched: ProjectInfo[] = await Promise.all(
            projects.map(async (dirName) => {
              try {
                const metadata = await metadataRepo.readMetadata(dirName);
                return {
                  name: dirName,
                  friendlyName: metadata?.friendlyName ?? dirName,
                };
              } catch {
                return { name: dirName, friendlyName: dirName };
              }
            })
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(enriched, null, 2),
              },
            ],
            isError: false,
          };
        } catch {
          // If enrichment fails, return original response
          return response;
        }
      };
    });
  }
};
