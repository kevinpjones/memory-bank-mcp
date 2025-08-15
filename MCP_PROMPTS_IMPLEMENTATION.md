# MCP Server Prompts Implementation

This document describes the implementation of MCP Server Prompts support for the memory bank MCP server, following the official [MCP Server Prompts specification](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts).

## Overview

The MCP server now supports prompt discovery and execution capabilities, allowing MCP clients to:
- Discover available prompt templates
- Execute prompts with parameter substitution
- Use reusable prompt templates across different AI interactions

## Architecture

The implementation follows the existing clean architecture pattern with:

- **Domain Layer**: Entities and use cases for prompts
- **Data Layer**: Repository interfaces and implementations
- **Infrastructure Layer**: File-system based prompt storage
- **Presentation Layer**: Controllers for MCP endpoints
- **Main Layer**: Dependency injection and MCP route configuration

## Prompt Storage

Prompts are stored as Markdown files in a `.prompts` directory at the memory bank root with:
- YAML frontmatter for metadata (name, title, description, arguments)
- Markdown content as the prompt template
- `{{param_name}}` syntax for parameter substitution

### Example Prompt File (`.prompts/code-review.md`)

```markdown
---
name: code-review
title: Code Review Assistant
description: Analyzes code for quality, best practices, and potential improvements
arguments:
  - name: code
    description: The code to review
    required: true
  - name: language
    description: Programming language of the code
    required: false
  - name: focus
    description: Specific aspect to focus on (security, performance, style, etc.)
    required: false
---

Please conduct a thorough code review of the following {{language}} code:

```{{language}}
{{code}}
```

Please pay special attention to: {{focus}}

Analyze the code for:
- Code quality and readability
- Best practices adherence
- Potential bugs or issues
- Performance considerations
- Security vulnerabilities
- Suggested improvements

Provide specific recommendations with explanations.
```

## MCP Endpoints

The server now supports the standard MCP prompts endpoints:

### `prompts/list`
- Returns available prompts with their metadata
- No parameters required
- Response includes prompt names, descriptions, and argument definitions

### `prompts/get`
- Executes a specific prompt with provided parameters
- Parameters:
  - `name`: The prompt name (required)
  - `arguments`: Key-value pairs for parameter substitution (optional)
- Returns rendered prompt messages ready for LLM consumption

## Server Capabilities

The server declares prompts capability in its initialization:

```json
{
  "capabilities": {
    "tools": { "listChanged": false },
    "prompts": { "listChanged": false }
  }
}
```

## Sample Prompts

Three sample prompts are included for testing:

1. **code-review**: Analyzes code for quality and improvements
2. **doc-generator**: Generates comprehensive documentation
3. **explain-concept**: Explains technical concepts in simple terms

## Usage

1. **Start the server** with the memory bank root environment variable:
   ```bash
   MEMORY_BANK_ROOT=/path/to/memory/bank node dist/main/index.js
   ```

2. **MCP clients can discover prompts**:
   - Call `prompts/list` to get available prompts
   - Call `prompts/get` with prompt name and parameters to execute

3. **Add custom prompts**:
   - Create `.md` files in the `.prompts` directory
   - Include YAML frontmatter with metadata
   - Use `{{param_name}}` for parameter substitution

## Technical Implementation Details

### Key Components

- **`FsPromptRepository`**: File-system based prompt storage with YAML frontmatter parsing
- **`ListPrompts`** / **`GetPrompt`**: Use cases for prompt operations
- **`ListPromptsController`** / **`GetPromptController`**: MCP request handlers
- **MCP Adapters**: Bridge MCP protocol to internal controller architecture

### Parameter Substitution

- Simple `{{param_name}}` replacement using regex
- Required parameter validation
- Support for optional parameters

### Error Handling

- Missing prompt files
- Invalid YAML frontmatter
- Missing required parameters
- Graceful fallbacks for malformed prompts

## Testing

The implementation includes:
- Sample prompt templates for validation
- Compilation verification
- Architecture consistency with existing codebase

## Future Enhancements

Potential improvements could include:
- Advanced templating with conditionals and loops
- Prompt versioning
- Dynamic prompt generation
- Prompt categories and tags
- Prompt usage analytics

---

This implementation provides a robust foundation for MCP Server Prompts while maintaining compatibility with the existing memory bank functionality.