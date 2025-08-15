import {
  Request as MCPRequest,
  ServerResult as MCPResponse,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

export type MCPRequestHandler = (request: MCPRequest) => Promise<MCPResponse>;

export type MCPRoute = {
  schema: Tool;
  handler: Promise<MCPRequestHandler>;
};

export class McpRouterAdapter {
  private tools: Map<string, MCPRoute> = new Map();

  public getToolHandler(name: string): MCPRoute["handler"] | undefined {
    return this.tools.get(name)?.handler;
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

  public setTool({ schema, handler }: MCPRoute): McpRouterAdapter {
    this.tools.set(schema.name, { schema, handler });
    return this;
  }
}
