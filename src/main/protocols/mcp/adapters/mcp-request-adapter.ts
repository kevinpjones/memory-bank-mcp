import {
  Request as MCPRequest,
  ServerResult as MCPResponse,
} from "@modelcontextprotocol/sdk/types.js";
import { Controller } from "../../../../presentation/protocols/controller.js";
import { serializeError } from "../helpers/serialize-error.js";
import { MCPRequestHandler } from "./mcp-router-adapter.js";

export const adaptMcpRequestHandler = async <
  T extends any,
  R extends Error | any
>(
  controller: Controller<T, R>
): Promise<MCPRequestHandler> => {
  return async (request: MCPRequest): Promise<MCPResponse> => {
    const { params } = request;
    const body = params?.arguments as T;
    const response = await controller.handle({
      body,
    });

    const isError = response.statusCode < 200 || response.statusCode >= 300;

    // MCP specification compliant response format
    if (isError) {
      const errorDetails = serializeError(response.body, false);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorDetails.error}\nType: ${errorDetails.name}${errorDetails.code ? `\nCode: ${errorDetails.code}` : ''}`,
          },
        ],
        isError: true,
      };
    }

    // For successful responses, handle different content types
    let responseText: string;
    if (typeof response.body === 'string') {
      responseText = response.body;
    } else if (Array.isArray(response.body)) {
      responseText = JSON.stringify(response.body, null, 2);
    } else if (typeof response.body === 'object' && response.body !== null) {
      responseText = JSON.stringify(response.body, null, 2);
    } else {
      responseText = String(response.body);
    }

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
      isError: false,
    };
  };
};
