/**
 * Domain entities for MCP Server Prompts
 * Based on MCP Protocol Specification 2025-06-18
 */

/**
 * Argument definition for a prompt
 */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Text content in a prompt message
 */
export interface TextContent {
  type: "text";
  text: string;
}

/**
 * Image content in a prompt message
 */
export interface ImageContent {
  type: "image";
  data: string; // base64-encoded
  mimeType: string;
}

/**
 * Audio content in a prompt message
 */
export interface AudioContent {
  type: "audio";
  data: string; // base64-encoded
  mimeType: string;
}

/**
 * Embedded resource content in a prompt message
 */
export interface ResourceContent {
  type: "resource";
  resource: {
    uri: string;
    name: string;
    title?: string;
    mimeType: string;
    text?: string;
    blob?: string; // base64-encoded
  };
}

/**
 * Union type for all content types
 */
export type PromptContent = TextContent | ImageContent | AudioContent | ResourceContent;

/**
 * A message within a prompt
 */
export interface PromptMessage {
  role: "user" | "assistant";
  content: PromptContent;
}

/**
 * A prompt template with metadata
 */
export interface Prompt {
  name: string;
  title?: string;
  description?: string;
  arguments?: PromptArgument[];
}

/**
 * Result of getting a prompt with its messages
 */
export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

/**
 * Raw prompt file content structure
 */
export interface PromptFileContent {
  metadata: {
    name: string;
    title?: string;
    description?: string;
    arguments?: PromptArgument[];
  };
  template: string;
}