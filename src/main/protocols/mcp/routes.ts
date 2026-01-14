import {
  makeDeleteController,
  makeListProjectFilesController,
  makeListProjectsController,
  makePatchController,
  makeReadController,
  makeUpdateController,
  makeWriteController,
  makeListPromptsController,
  makeGetPromptController,
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
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: adaptMcpRequestHandler(makeReadController()),
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

  // Prompt endpoints
  router.setPromptListHandler(
    adaptMcpListPromptsHandler(makeListPromptsController())
  );

  router.setPromptGetHandler(
    adaptMcpGetPromptHandler(makeGetPromptController())
  );

  return router;
};
