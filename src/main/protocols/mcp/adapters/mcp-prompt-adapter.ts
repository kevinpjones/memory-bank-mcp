import {
  Request as MCPRequest,
  GetPromptRequest,
  ListPromptsRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { Controller, Response, Request } from "../../../../presentation/protocols/index.js";
import { MCPRequestHandler } from "./mcp-router-adapter.js";

/**
 * Adapts a controller to handle MCP list prompts requests
 */
export const adaptMcpListPromptsHandler = <TResponse>(
  controller: Controller<void, TResponse>
): MCPRequestHandler => {
  return async (request: MCPRequest) => {
    const response: Response<TResponse> = await controller.handle({});

    if (response.statusCode === 200) {
      return {
        prompts: response.body as any,
      };
    } else {
      const error = response.body as any;
      throw new Error(error?.message || "Internal server error");
    }
  };
};

/**
 * Adapts a controller to handle MCP get prompt requests
 */
export const adaptMcpGetPromptHandler = <TRequest, TResponse>(
  controller: Controller<TRequest, TResponse>
): MCPRequestHandler => {
  return async (request: MCPRequest) => {
    const getPromptRequest = request as GetPromptRequest;
    const { name, arguments: args } = getPromptRequest.params;

    const controllerRequest: Request<TRequest> = {
      body: {
        name,
        args,
      } as TRequest,
    };

    const response: Response<TResponse> = await controller.handle(controllerRequest);

    if (response.statusCode === 200) {
      return response.body as any;
    } else {
      const error = response.body as any;
      throw new Error(error?.message || "Internal server error");
    }
  };
};