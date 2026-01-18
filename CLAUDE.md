# CLAUDE.md

This file provides guidance for working with code in this repository.

## Project Overview

Memory Bank MCP Server is a Model Context Protocol (MCP) server that provides remote memory bank management for AI assistants. It allows storing and retrieving project documentation files across multiple projects, with features like safe file archiving on delete and MCP prompt templates.

## Common Commands

```bash
# Build the project (compiles TypeScript to dist/)
npm run build

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run tests/path/to/file.test.ts

# Run tests matching a pattern
npx vitest run -t "pattern"

# Development mode (runs with ts-node)
npm run dev

# Web UI development (Next.js)
npm run dev:web
npm run test:web
npm run e2e:web
```

## Architecture

The codebase follows Clean Architecture with strict layer separation:

```
src/
├── domain/          # Business logic interfaces (use case contracts, entities)
├── data/            # Use case implementations
├── infra/           # External dependencies (filesystem repositories)
├── presentation/    # Controllers, validators, errors
├── main/            # Composition root (factories, MCP server setup)
└── web-ui/          # Next.js web interface (separate TypeScript config)
```

### Layer Dependencies

- **domain/** - Pure interfaces with no dependencies. Defines `UseCase` contracts and entity types.
- **data/** - Implements domain use cases. Each use case has its own directory with a `-protocols.ts` file re-exporting dependencies.
- **infra/** - Filesystem repository implementations (`FsFileRepository`, `FsProjectRepository`, `FsPromptRepository`).
- **presentation/** - Controllers call use cases via injected interfaces. Each controller has a dedicated directory.
- **main/** - Wires everything together. Factory functions in `factories/` create controllers and use cases with proper dependencies.

### MCP Integration

The MCP server is configured in `src/main/protocols/mcp/`:
- `app.ts` - Creates the server instance
- `routes.ts` - Defines all MCP tools and their schemas
- `adapters/` - Adapts controllers to MCP request/response format

### Key Patterns

**Factory Pattern**: All object creation goes through factories in `src/main/factories/`. Controllers get use cases and validators injected.

**Validator Composition**: Validators are composable via `ValidatorComposite`. Common validators: `RequiredFieldValidator`, `PathSecurityValidator`, `ParamNameValidator`.

**Content Normalization**: The `content-normalizer.ts` helper handles line ending normalization (CRLF to LF) and stripping line number prefixes from content.

## Testing Conventions

Tests mirror the source structure in `tests/`. Each test file creates a System Under Test (SUT) using the `makeSut()` pattern:

```typescript
const makeSut = () => {
  const validatorStub = makeValidator<RequestType>();
  const useCaseStub = makeUseCaseStub();
  const sut = new Controller(useCaseStub, validatorStub);
  return { sut, validatorStub, useCaseStub };
};
```

Test mocks are in `tests/presentation/mocks/` and `tests/data/mocks/`.

## Environment Configuration

The server requires `MEMORY_BANK_ROOT` environment variable pointing to the directory where project memory banks are stored.

## MCP Tools

The server exposes these MCP tools:
- `list_projects` - List all projects
- `list_project_files` - List files in a project
- `memory_bank_read` - Read file (with optional line numbers)
- `memory_bank_write` - Create new file
- `memory_bank_update` - Update existing file
- `memory_bank_patch` - Surgical line-range replacement
- `memory_bank_delete` - Archive file with timestamp

## Web UI

The Next.js 15 web interface in `src/web-ui/` provides a browser-based UI for browsing memory bank content. It reuses the same use cases and repositories from the MCP server.

### Web UI Commands

```bash
# Development server with Turbopack
npm run dev:web

# Run unit tests
npm run test:web

# Run E2E tests (Playwright)
npm run e2e:web
npm run e2e:web:ui   # with UI

# Build and serve production
npm run build:web
npm run serve:web
```

### Web UI Structure

```
src/web-ui/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── projects/      # /api/projects, /api/projects/[id]
│   │   └── prompts/       # /api/prompts, /api/prompts/[name]
│   ├── projects/[id]/     # Project detail, files, search pages
│   └── prompts/           # Prompts listing and detail pages
├── components/            # React components (Layout, ProjectList, PromptList, MarkdownRenderer)
├── contexts/              # ThemeContext for dark/light mode
├── lib/                   # memory-bank.ts - service layer
├── test/                  # Unit tests (Vitest + Testing Library)
└── e2e/                   # E2E tests (Playwright)
```

### Web UI Architecture

**Service Layer** (`lib/memory-bank.ts`): The `MemoryBankService` class wraps the existing use cases (`ListProjects`, `ReadFile`, etc.) from the MCP server and adds web-specific functionality like project search and enhanced metadata. API routes call this service directly.

**API Routes**: Next.js route handlers in `app/api/` that return JSON responses. They use the `memoryBankService` singleton.

**Pages**: Client components using `'use client'` directive. They fetch data from API routes and render with dynamic imports to avoid SSR hydration issues.

**Components**:
- `Layout` - Header with theme toggle, navigation tabs (Projects/Prompts), breadcrumbs, footer
- `ProjectList` - Searchable project cards with archive functionality
- `PromptList` - MCP prompt template browser
- `MarkdownRenderer` - Renders markdown with syntax highlighting

**Theme**: `ThemeContext` provides `useTheme()` hook for dark/light mode. Theme preference persists to localStorage.

### Web UI Testing

Unit tests use Vitest with jsdom environment and React Testing Library. Tests are in `src/web-ui/test/` and have 90% coverage thresholds.

E2E tests use Playwright and are in `src/web-ui/e2e/`.

Web UI tests are completely separate from the main MCP server tests.