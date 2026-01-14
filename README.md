# Memory Bank MCP Server

[![smithery badge](https://smithery.ai/badge/@alioshr/memory-bank-mcp)](https://smithery.ai/server/@alioshr/memory-bank-mcp)
[![npm version](https://badge.fury.io/js/%40allpepper%2Fmemory-bank-mcp.svg)](https://www.npmjs.com/package/@allpepper/memory-bank-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@allpepper/memory-bank-mcp.svg)](https://www.npmjs.com/package/@allpepper/memory-bank-mcp)

<a href="https://glama.ai/mcp/servers/ir18x1tixp"><img width="380" height="200" src="https://glama.ai/mcp/servers/ir18x1tixp/badge" alt="Memory Bank Server MCP server" /></a>

A Model Context Protocol (MCP) server implementation for remote memory bank management, inspired by [Cline Memory Bank](https://github.com/nickbaumann98/cline_docs/blob/main/prompting/custom%20instructions%20library/cline-memory-bank.md).

## Overview

The Memory Bank MCP Server transforms traditional file-based memory banks into a centralized service that:

- Provides remote access to memory bank files via MCP protocol
- Enables multi-project memory bank management
- Maintains consistent file structure and validation
- Ensures proper isolation between project memory banks

## Features

- **Multi-Project Support**

  - Project-specific directories
  - File structure enforcement
  - Path traversal prevention
  - Project listing capabilities
  - File listing per project

- **Remote Accessibility**

  - Full MCP protocol implementation
  - Type-safe operations
  - Proper error handling
  - Security through project isolation

- **Core Operations**
  - Read/write/update/delete memory bank files
  - Safe file deletion with automatic archiving
  - List available projects (excludes hidden directories)
  - List files within projects
  - Project existence validation
  - Safe read-only operations

- **Enhanced Security & Safety**
  - Hidden directory filtering (directories starting with `.` are excluded from project listings)
  - Safe file deletion with archiving (files are moved to `.archive/` with timestamps instead of permanent deletion)
  - Archive structure preserves original project organization
  - Timestamped file naming prevents conflicts: `filename-DELETED-<ISO8601-timestamp>.ext`

- **MCP Server Prompts Support**
  - Discover and execute reusable prompt templates
  - Parameter substitution with validation
  - Organized prompt storage in `.prompts` directory
  - Support for required and optional parameters

## Installation

To install Memory Bank Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@alioshr/memory-bank-mcp):

```bash
npx -y @smithery/cli install @alioshr/memory-bank-mcp --client claude
```

This will set up the MCP server configuration automatically. Alternatively, you can configure the server manually as described in the Configuration section below.

## Quick Start

1. Configure the MCP server in your settings (see Configuration section below)
2. Start using the memory bank tools in your AI assistant

## Using with Cline/Roo Code

The memory bank MCP server needs to be configured in your Cline MCP settings file. The location depends on your setup:

- For Cline extension: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- For Roo Code VS Code extension: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`

Add the following configuration to your MCP settings:

```json
{
  "allpepper-memory-bank": {
    "command": "npx",
    "args": ["-y", "@allpepper/memory-bank-mcp"],
    "env": {
      "MEMORY_BANK_ROOT": "<path-to-bank>"
    },
    "disabled": false,
    "autoApprove": [
      "memory_bank_read",
      "memory_bank_write",
      "memory_bank_update",
      "memory_bank_delete",
      "list_projects",
      "list_project_files"
    ]
  }
}
```

### Configuration Details

- `MEMORY_BANK_ROOT`: Directory where project memory banks will be stored (e.g., `/path/to/memory-bank`)
- `disabled`: Set to `false` to enable the server
- `autoApprove`: List of operations that don't require explicit user approval:
  - `memory_bank_read`: Read memory bank files
  - `memory_bank_write`: Create new memory bank files
  - `memory_bank_update`: Update existing memory bank files
  - `memory_bank_delete`: Delete memory bank files (archives them safely)
  - `list_projects`: List available projects (excludes hidden directories)
  - `list_project_files`: List files within a project

### Line Number Support

The `memory_bank_read` tool includes optional line number metadata to assist with patch operations.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | The name of the project |
| `fileName` | string | Yes | - | The name of the file to read |
| `includeLineNumbers` | boolean | No | `true` | Include line numbers as metadata prefix |

#### Line Number Format

When `includeLineNumbers` is enabled (default), each line is prefixed with its 1-indexed line number followed by a pipe separator:

```
1|# Project Brief
2|
3|## Overview
4|This is an example file content.
5|
6|## Goals
7|- Goal 1
8|- Goal 2
```

**Format characteristics:**
- **1-indexed**: Line numbers start at 1, matching standard editor conventions
- **Pipe separator**: The `|` character provides an unambiguous delimiter that's easily parseable
- **Right-padded**: Line numbers are padded for alignment in files with many lines (e.g., `  1|` for files with 100+ lines)
- **Metadata only**: Line numbers are added to the response only and are never persisted to disk

#### Usage Examples

**Read with line numbers (default):**
```json
{
  "projectName": "my-project",
  "fileName": "activeContext.md"
}
```

**Read without line numbers:**
```json
{
  "projectName": "my-project",
  "fileName": "activeContext.md",
  "includeLineNumbers": false
}
```

#### Parsing Line Numbers

For clients using the line-numbered content for patch operations:

```javascript
// Parse a line-numbered response
function parseLineNumberedContent(content) {
  return content.split('\n').map(line => {
    const match = line.match(/^\s*(\d+)\|(.*)$/);
    if (match) {
      return {
        lineNumber: parseInt(match[1], 10),
        content: match[2]
      };
    }
    return { lineNumber: null, content: line };
  });
}
```

#### Data Integrity

- Line numbers are **only added to retrieval responses**
- Line numbers are **never persisted** to Memory Bank files on disk
- Write and update operations receive content as-is (clients should strip any line numbers before saving)

## MCP Server Prompts

The server supports the [MCP Server Prompts specification](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts), allowing you to create and use reusable prompt templates.

### Prompt Storage

Prompts are stored as Markdown files in a `.prompts` directory at your memory bank root:
- YAML frontmatter contains metadata (name, title, description, arguments)
- Markdown content serves as the prompt template
- Use `{{param_name}}` syntax for parameter substitution

### Example Prompt File

Create `.prompts/code-review.md`:

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

### Using Prompts

MCP clients can:
1. **Discover prompts**: Use `prompts/list` to see available prompt templates
2. **Execute prompts**: Use `prompts/get` with a prompt name and parameters to get the rendered result

### Sample Prompts Included

The server includes three sample prompts for immediate use:
- **code-review**: Analyzes code for quality and improvements
- **doc-generator**: Generates comprehensive documentation
- **explain-concept**: Explains technical concepts in simple terms

### Adding Custom Prompts

1. Create `.md` files in the `.prompts` directory
2. Include YAML frontmatter with prompt metadata
3. Use `{{param_name}}` for parameter substitution in the template
4. Define required and optional arguments in the metadata


## Using with Cursor

For Cursor, open the settings -> features -> add MCP server -> add the following:

```shell
env MEMORY_BANK_ROOT=<path-to-bank> npx -y @allpepper/memory-bank-mcp@latest
```
## Using with Claude

- Claude desktop config file: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Code config file:  `~/.claude.json`

1. Locate the config file
3. Locate the property called `mcpServers`
4. Paste this:

```
 "allPepper-memory-bank": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@allpepper/memory-bank-mcp@latest"
          ],
          "env": {
            "MEMORY_BANK_ROOT": "YOUR PATH"
          }
        }
```

## Custom AI instructions

This section contains the instructions that should be pasted on the AI custom instructions, either for Cline, Claude or Cursor, or any other MCP client. You should copy and paste these rules. For reference, see [custom-instructions.md](custom-instructions.md) which contains these rules.

## Web Interface

The Memory Bank MCP Server includes a modern web interface that provides a user-friendly way to browse and search your memory bank content through a web browser. The web interface is built with Next.js and provides a responsive, accessible experience with both light and dark theme support.

### Features

- **Project Browser**: View all your memory bank projects in a clean, searchable interface
- **File Explorer**: Browse files within each project with sorting and filtering capabilities
- **Markdown Renderer**: Full markdown support with syntax highlighting for code blocks
- **Full-Text Search**: Search within project files with context and match highlighting
- **Theme Support**: Toggle between light and dark themes with persistent preferences
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Breadcrumb Navigation**: Easy navigation between projects, files, and search results

### Installation and Setup

1. **Navigate to the web interface directory:**
   ```bash
   cd web-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the `web-ui` directory:
   ```bash
   # Memory Bank Configuration
   MEMORY_BANK_ROOT=/path/to/your/memory-bank
   
   # Application Configuration  
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Access the web interface:**
   Open your browser and navigate to `http://localhost:3000`

### Available Scripts

The web interface includes several npm scripts for development and production:

- `npm start` - Start development server (Next.js with Turbopack)
- `npm run build` - Build production bundle
- `npm run serve` - Serve production build locally
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run e2e` - Run end-to-end tests
- `npm run e2e:ui` - Run E2E tests with UI
- `npm run lint` - Run ESLint

### API Endpoints

The web interface provides RESTful API endpoints that reuse the existing MCP server infrastructure:

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details and file list
- `GET /api/projects/:id/files/:path` - Get file content
- `GET /api/projects/:id/search?q=term` - Search within project

### Usage Guide

#### Browsing Projects

1. The main page displays all your memory bank projects
2. Use the search bar to filter projects by name or description
3. Click on any project card to view its contents

#### Exploring Project Files

1. From a project page, view all files in a sortable table
2. Sort by name, size, or last modified date
3. Click on any file to view its content
4. Use the "Search in this project" button for full-text search

#### Viewing Files

1. Markdown files are rendered with syntax highlighting
2. Regular text files are displayed in a formatted code block
3. Use the copy button to copy file content to clipboard
4. Navigate using breadcrumbs at the top

#### Searching Content

1. From any project page, click "Search in this project"
2. Enter search terms and optionally enable case-sensitive search
3. View results with context lines before and after matches
4. Click on file names in results to view the full file

#### Theme Switching

1. Use the sun/moon icon in the header to toggle themes
2. Your preference is automatically saved and restored
3. The interface respects your system's dark mode preference by default

### Testing

The web interface includes comprehensive testing:

**Unit Tests:**
```bash
npm test                    # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
```

**End-to-End Tests:**
```bash
npm run e2e                 # Run E2E tests
npm run e2e:ui              # Run with Playwright UI
```

**Test Coverage:**
The test suite maintains 90%+ code coverage across:
- React components and hooks
- API route handlers
- User interaction flows
- Error handling scenarios
- Responsive design behavior

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm run serve
   ```

3. **Environment Configuration:**
   Set the `MEMORY_BANK_ROOT` environment variable to point to your memory bank directory.

### Troubleshooting

**Common Issues:**

1. **"No projects found"**
   - Verify `MEMORY_BANK_ROOT` points to the correct directory
   - Ensure the directory contains project subdirectories
   - Check file permissions

2. **API errors**
   - Confirm the memory bank directory is accessible
   - Check that project directories contain files
   - Verify environment variables are set correctly

3. **Search not working**
   - Ensure project files contain searchable content
   - Try different search terms
   - Check that files are readable

**Performance Tips:**

- Large projects (>1000 files) may take longer to load
- Search performance depends on file sizes and content
- Consider organizing projects by logical boundaries

### Architecture

The web interface is built with:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes that reuse existing MCP server repositories
- **Testing**: Vitest for unit tests, Playwright for E2E testing
- **Styling**: Tailwind CSS with dark mode support
- **Markdown**: React Markdown with GitHub Flavored Markdown and syntax highlighting

The interface integrates seamlessly with the existing Memory Bank MCP Server infrastructure, reusing the same repository patterns and use cases to ensure consistency and reliability.

## Development

Basic development commands:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run the server directly with ts-node for quick testing
npm run dev
```

### Running with Docker

1. Build the Docker image:

    ```bash
    docker build -t memory-bank-mcp:local .
    ```

2. Run the Docker container for testing:

    ```bash
    docker run -i --rm \
      -e MEMORY_BANK_ROOT="/mnt/memory_bank" \
      -v /path/to/memory-bank:/mnt/memory_bank \
      --entrypoint /bin/sh \
      memory-bank-mcp:local \
      -c "ls -la /mnt/memory_bank"
    ```

3. Add MCP configuration, example for Roo Code:

    ```json
    "allpepper-memory-bank": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", 
        "MEMORY_BANK_ROOT",
        "-v", 
        "/path/to/memory-bank:/mnt/memory_bank",
        "memory-bank-mcp:local"
      ],
      "env": {
        "MEMORY_BANK_ROOT": "/mnt/memory_bank"
      },
      "disabled": false,
      "alwaysAllow": [
        "list_projects",
        "list_project_files",
        "memory_bank_read",
        "memory_bank_update",
        "memory_bank_write",
        "memory_bank_delete"
      ]
    }
    ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Maintain type safety across the codebase
- Add tests for new features
- Update documentation as needed
- Follow existing code style and patterns

### Testing

- Write unit tests for new features
- Include multi-project scenario tests
- Test error cases thoroughly
- Validate type constraints
- Mock filesystem operations appropriately

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project implements the memory bank concept originally documented in the [Cline Memory Bank](https://github.com/nickbaumann98/cline_docs/blob/main/prompting/custom%20instructions%20library/cline-memory-bank.md), extending it with remote capabilities and multi-project support.
