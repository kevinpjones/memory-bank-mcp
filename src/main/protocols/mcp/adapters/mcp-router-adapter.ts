import {
  Request as MCPRequest,
  ServerResult as MCPResponse,
  Tool,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";

export type MCPRequestHandler = (request: MCPRequest) => Promise<MCPResponse>;

/**
 * Shape of a tool response from the MCP request adapter.
 * The SDK's ServerResult is a union type, so we define the shape we expect
 * for tool call responses that include content and error status.
 */
export interface ToolResponse {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export type MCPRoute = {
  schema: Tool;
  handler: Promise<MCPRequestHandler>;
};

export type MCPPromptRoute = {
  schema: Prompt;
  handler: Promise<MCPRequestHandler>;
};

export class McpRouterAdapter {
  private tools: Map<string, MCPRoute> = new Map();
  private promptListHandler: MCPRequestHandler | null = null;
  private promptGetHandler: MCPRequestHandler | null = null;

  public getToolHandler(name: string): MCPRoute["handler"] | undefined {
    return this.tools.get(name)?.handler;
  }

  public getPromptListHandler(): MCPRequestHandler | null {
    return this.promptListHandler;
  }

  public getPromptGetHandler(): MCPRequestHandler | null {
    return this.promptGetHandler;
  }

  private mapTools(callback: (name: string) => any) {
    return Array.from(this.tools.keys()).map(callback);
  }

  public getToolsSchemas() {
    return Array.from(this.tools.keys()).map(
      (name) => this.tools.get(name)?.schema
    );
  }

  // MCP specification compliant tool capabilities format
  public getToolCapabilities() {
    return {
      listChanged: false // Set to true if the server supports notifications when tools change
    };
  }

  // MCP specification compliant prompt capabilities format
  public getPromptCapabilities() {
    return {
      listChanged: false // Set to true if the server supports notifications when prompts change
    };
  }

  public setTool({ schema, handler }: MCPRoute): McpRouterAdapter {
    this.tools.set(schema.name, { schema, handler });
    return this;
  }

  public setPromptListHandler(handler: MCPRequestHandler): McpRouterAdapter {
    this.promptListHandler = handler;
    return this;
  }

  public setPromptGetHandler(handler: MCPRequestHandler): McpRouterAdapter {
    this.promptGetHandler = handler;
    return this;
  }
}
