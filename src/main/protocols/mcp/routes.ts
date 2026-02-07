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
} from "../../factories/controllers/index.js";
import { adaptMcpRequestHandler } from "./adapters/mcp-request-adapter.js";
import { adaptMcpListPromptsHandler, adaptMcpGetPromptHandler } from "./adapters/mcp-prompt-adapter.js";
import { McpRouterAdapter } from "./adapters/mcp-router-adapter.js";

export default () => {
  const router = new McpRouterAdapter();

  // Tool endpoints
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
    handler: adaptMcpRequestHandler(makeListProjectsController()),
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
    handler: adaptMcpRequestHandler(makeListProjectFilesController()),
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
            description: "Whether to include line numbers as metadata prefix in the returned content. When enabled, each line is prefixed with its 1-indexed line number followed by a pipe separator (e.g., '1|first line'). Useful for patch operations. Default: true",
            default: true,
          },
          startLine: {
            type: "integer",
            description: "First line to read (1-based indexing). When omitted, reading starts from the beginning of the file.",
          },
          endLine: {
            type: "integer",
            description: "Last line to read (1-based indexing, inclusive). When omitted, reading continues to the end of the file.",
          },
          maxLines: {
            type: "integer",
            description: "Maximum number of lines to return. When used with startLine, returns up to maxLines starting from startLine. When used alone, returns the first maxLines of the file.",
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: adaptMcpRequestHandler(makeReadController()),
  });

  router.setTool({
    schema: {
      name: "peek_file",
      title: "Peek Memory Bank File",
      description: "Quick inspection of a memory bank file. Returns file metadata (total line count) and a preview of the first N lines. Useful for understanding file size and content before reading the full file, preventing context overload with large files.",
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
            description: "Number of lines to include in the preview (default: 10)",
            default: 10,
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: adaptMcpRequestHandler(makePeekController()),
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
    handler: adaptMcpRequestHandler(makeWriteController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_update",
      title: "Update Memory Bank File",
      description: "Update an existing memory bank file for a specific project",
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
    handler: adaptMcpRequestHandler(makeUpdateController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_delete",
      description: "Delete a memory bank file by archiving it with a timestamp",
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
    handler: adaptMcpRequestHandler(makeDeleteController()),
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
    handler: adaptMcpRequestHandler(makePatchController()),
  });

  router.setTool({
    schema: {
      name: "get_project_history",
      title: "Get Project History",
      description: "Get the change history for all files in a project. Returns metadata (timestamp, action, actor, fileName) for all historical changes without file content for efficient browsing.",
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
    handler: adaptMcpRequestHandler(makeGetProjectHistoryController()),
  });

  router.setTool({
    schema: {
      name: "get_file_at_time",
      title: "Get File At Time",
      description: "Retrieve the content of a specific file at a specific point in time. Use this after browsing project history to get the actual content of a file at a particular timestamp.",
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
            description: "ISO 8601 timestamp to get the file content at (e.g., '2024-01-15T10:30:00.000Z')",
          },
        },
        required: ["projectName", "fileName", "timestamp"],
      },
    },
    handler: adaptMcpRequestHandler(makeGetFileAtTimeController()),
  });

  router.setTool({
    schema: {
      name: "get_project_file_history_diff",
      title: "Get File History Diff",
      description: "Generate a unified diff between two versions of a file. Returns standard unified diff format (similar to git diff) showing additions, deletions, and context lines.",
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
            description: "Target version number (1-based, optional - defaults to current/latest version)",
          },
        },
        required: ["projectName", "fileName", "versionFrom"],
      },
    },
    handler: adaptMcpRequestHandler(makeGetFileHistoryDiffController()),
  });

  // Prompt endpoints
  router.setPromptListHandler(
    adaptMcpListPromptsHandler(makeListPromptsController())
  );

  router.setPromptGetHandler(
    adaptMcpGetPromptHandler(makeGetPromptController())
  );

  return router;
};
