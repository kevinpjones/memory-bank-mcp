import { describe, expect, it, vi } from "vitest";
import { adaptMcpListPromptsHandler, adaptMcpGetPromptHandler } from "../../../../../src/main/protocols/mcp/adapters/mcp-prompt-adapter.js";
import { Controller, Response } from "../../../../../src/presentation/protocols/index.js";
import { Request as MCPRequest, GetPromptRequest } from "@modelcontextprotocol/sdk/types.js";

// Mock controller for list prompts
const makeListPromptsControllerMock = () => {
  const mockController: Controller<void, any> = {
    async handle() {
      return {
        statusCode: 200,
        body: [
          {
            name: "test-prompt",
            title: "Test Prompt",
            description: "A test prompt",
            arguments: [
              {
                name: "message",
                description: "The message",
                required: true
              }
            ]
          }
        ]
      };
    }
  };
  return mockController;
};

// Mock controller for get prompt
const makeGetPromptControllerMock = () => {
  const mockController: Controller<any, any> = {
    async handle(request) {
      if (request.body?.name === "test-prompt") {
        return {
          statusCode: 200,
          body: {
            description: "A test prompt result",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: "Test message"
                }
              }
            ]
          }
        };
      }
      
      return {
        statusCode: 500,
        body: { message: "Prompt not found" }
      };
    }
  };
  return mockController;
};

describe("MCP Prompt Adapters", () => {
  describe("adaptMcpListPromptsHandler", () => {
    it("should return prompts list when controller succeeds", async () => {
      const controller = makeListPromptsControllerMock();
      const handler = adaptMcpListPromptsHandler(controller);
      
      const mockRequest = {} as MCPRequest;
      
      const result = await handler(mockRequest);
      
      expect(result).toEqual({
        prompts: [
          {
            name: "test-prompt",
            title: "Test Prompt",
            description: "A test prompt",
            arguments: [
              {
                name: "message",
                description: "The message",
                required: true
              }
            ]
          }
        ]
      });
    });

    it("should call controller with empty request object", async () => {
      const controller = makeListPromptsControllerMock();
      const handleSpy = vi.spyOn(controller, "handle");
      const handler = adaptMcpListPromptsHandler(controller);
      
      const mockRequest = {} as MCPRequest;
      
      await handler(mockRequest);
      
      expect(handleSpy).toHaveBeenCalledWith({});
    });

    it("should throw error when controller returns error status", async () => {
      const errorController: Controller<void, any> = {
        async handle() {
          return {
            statusCode: 500,
            body: { message: "Internal error" }
          };
        }
      };
      
      const handler = adaptMcpListPromptsHandler(errorController);
      const mockRequest = {} as MCPRequest;
      
      await expect(handler(mockRequest)).rejects.toThrow("Internal error");
    });

    it("should handle controller errors without message property", async () => {
      const errorController: Controller<void, any> = {
        async handle() {
          return {
            statusCode: 500,
            body: "Simple error string"
          };
        }
      };
      
      const handler = adaptMcpListPromptsHandler(errorController);
      const mockRequest = {} as MCPRequest;
      
      await expect(handler(mockRequest)).rejects.toThrow("Internal server error");
    });

    it("should handle empty prompts list", async () => {
      const emptyController: Controller<void, any> = {
        async handle() {
          return {
            statusCode: 200,
            body: []
          };
        }
      };
      
      const handler = adaptMcpListPromptsHandler(emptyController);
      const mockRequest = {} as MCPRequest;
      
      const result = await handler(mockRequest);
      
      expect(result).toEqual({
        prompts: []
      });
    });
  });

  describe("adaptMcpGetPromptHandler", () => {
    it("should return prompt result when controller succeeds", async () => {
      const controller = makeGetPromptControllerMock();
      const handler = adaptMcpGetPromptHandler(controller);
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt",
          arguments: { message: "hello" }
        }
      };
      
      const result = await handler(mockRequest as MCPRequest);
      
      expect(result).toEqual({
        description: "A test prompt result",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Test message"
            }
          }
        ]
      });
    });

    it("should call controller with properly structured request", async () => {
      const controller = makeGetPromptControllerMock();
      const handleSpy = vi.spyOn(controller, "handle");
      const handler = adaptMcpGetPromptHandler(controller);
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt",
          arguments: { message: "hello", tone: "friendly" }
        }
      };
      
      await handler(mockRequest as MCPRequest);
      
      expect(handleSpy).toHaveBeenCalledWith({
        body: {
          name: "test-prompt",
          args: { message: "hello", tone: "friendly" }
        }
      });
    });

    it("should handle request without arguments", async () => {
      const controller = makeGetPromptControllerMock();
      const handleSpy = vi.spyOn(controller, "handle");
      const handler = adaptMcpGetPromptHandler(controller);
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt"
        }
      };
      
      await handler(mockRequest as MCPRequest);
      
      expect(handleSpy).toHaveBeenCalledWith({
        body: {
          name: "test-prompt",
          args: undefined
        }
      });
    });

    it("should throw error when controller returns error status", async () => {
      const controller = makeGetPromptControllerMock();
      const handler = adaptMcpGetPromptHandler(controller);
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "non-existent-prompt"
        }
      };
      
      await expect(handler(mockRequest as MCPRequest)).rejects.toThrow("Prompt not found");
    });

    it("should handle controller errors without message property", async () => {
      const errorController: Controller<any, any> = {
        async handle() {
          return {
            statusCode: 400,
            body: "Bad request"
          };
        }
      };
      
      const handler = adaptMcpGetPromptHandler(errorController);
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt"
        }
      };
      
      await expect(handler(mockRequest as MCPRequest)).rejects.toThrow("Internal server error");
    });

    it("should handle empty arguments object", async () => {
      const controller = makeGetPromptControllerMock();
      const handleSpy = vi.spyOn(controller, "handle");
      const handler = adaptMcpGetPromptHandler(controller);
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt",
          arguments: {}
        }
      };
      
      await handler(mockRequest as MCPRequest);
      
      expect(handleSpy).toHaveBeenCalledWith({
        body: {
          name: "test-prompt",
          args: {}
        }
      });
    });

    it("should handle complex argument values", async () => {
      const controller = makeGetPromptControllerMock();
      const handleSpy = vi.spyOn(controller, "handle");
      const handler = adaptMcpGetPromptHandler(controller);
      
      const complexArgs = {
        message: "Hello & goodbye!",
        tone: "very excited",
        numbers: [1, 2, 3],
        nested: { key: "value" }
      };
      
      const mockRequest: GetPromptRequest = {
        method: "prompts/get",
        params: {
          name: "test-prompt",
          arguments: complexArgs
        }
      };
      
      await handler(mockRequest as MCPRequest);
      
      expect(handleSpy).toHaveBeenCalledWith({
        body: {
          name: "test-prompt",
          args: complexArgs
        }
      });
    });
  });
});