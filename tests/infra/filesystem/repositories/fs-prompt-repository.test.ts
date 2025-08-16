import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FsPromptRepository } from "../../../../src/infra/filesystem/repositories/fs-prompt-repository.js";

describe("FsPromptRepository", () => {
  let tempDir: string;
  let repository: FsPromptRepository;
  let promptsDir: string;

  beforeEach(async () => {
    // Create a temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "memory-bank-prompt-test-"));
    promptsDir = path.join(tempDir, ".prompts");
    repository = new FsPromptRepository(tempDir);
    
    // Ensure prompts directory exists
    await fs.ensureDir(promptsDir);
  });

  afterEach(() => {
    // Clean up after tests
    fs.removeSync(tempDir);
  });

  describe("listPrompts", () => {
    it("should return an empty array when no prompts exist", async () => {
      const result = await repository.listPrompts();
      expect(result).toEqual([]);
    });

    it("should return prompts when valid prompt files exist", async () => {
      // Create test prompt files
      const prompt1Content = `---
name: test-prompt-1
title: Test Prompt 1
description: A test prompt
arguments:
  - name: message
    description: The message
    required: true
---
Say {{message}}.`;

      const prompt2Content = `---
name: test-prompt-2
title: Test Prompt 2
description: Another test prompt
---
This is a simple prompt.`;

      await fs.writeFile(path.join(promptsDir, "test-prompt-1.md"), prompt1Content);
      await fs.writeFile(path.join(promptsDir, "test-prompt-2.md"), prompt2Content);

      const result = await repository.listPrompts();

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            name: "test-prompt-1",
            title: "Test Prompt 1",
            description: "A test prompt",
            arguments: [
              {
                name: "message",
                description: "The message",
                required: true
              }
            ]
          },
          {
            name: "test-prompt-2",
            title: "Test Prompt 2",
            description: "Another test prompt",
            arguments: []
          }
        ])
      );
    });

    it("should skip invalid prompt files and log warnings", async () => {
      // Create a valid prompt
      const validPrompt = `---
name: valid-prompt
title: Valid Prompt
---
This is valid.`;

      // Create an invalid prompt (missing name)
      const invalidPrompt = `---
title: Invalid Prompt
---
This is invalid.`;

      await fs.writeFile(path.join(promptsDir, "valid-prompt.md"), validPrompt);
      await fs.writeFile(path.join(promptsDir, "invalid-prompt.md"), invalidPrompt);

      const result = await repository.listPrompts();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("valid-prompt");
    });

    it("should ignore non-markdown files", async () => {
      const promptContent = `---
name: test-prompt
title: Test Prompt
---
Test content.`;

      await fs.writeFile(path.join(promptsDir, "test-prompt.md"), promptContent);
      await fs.writeFile(path.join(promptsDir, "not-a-prompt.txt"), "Not a prompt");

      const result = await repository.listPrompts();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test-prompt");
    });
  });

  describe("getPrompt", () => {
    it("should return prompt content for valid prompt", async () => {
      const promptContent = `---
name: test-prompt
title: Test Prompt
description: A test prompt
arguments:
  - name: message
    description: The message
    required: true
---
Say {{message}} please.`;

      await fs.writeFile(path.join(promptsDir, "test-prompt.md"), promptContent);

      const result = await repository.getPrompt("test-prompt");

      expect(result).toEqual({
        metadata: {
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
        },
        template: "Say {{message}} please."
      });
    });

    it("should throw error when prompt does not exist", async () => {
      await expect(repository.getPrompt("non-existent")).rejects.toThrow(
        "Prompt 'non-existent' not found"
      );
    });

    it("should throw error when prompt has missing required metadata", async () => {
      const invalidPrompt = `---
title: Invalid Prompt
---
Content without name.`;

      await fs.writeFile(path.join(promptsDir, "invalid.md"), invalidPrompt);

      await expect(repository.getPrompt("invalid")).rejects.toThrow(
        "Prompt 'invalid' missing required 'name' in metadata"
      );
    });

    it("should handle prompts with minimal metadata", async () => {
      const minimalPrompt = `---
name: minimal-prompt
---
Minimal content.`;

      await fs.writeFile(path.join(promptsDir, "minimal-prompt.md"), minimalPrompt);

      const result = await repository.getPrompt("minimal-prompt");

      expect(result).toEqual({
        metadata: {
          name: "minimal-prompt",
          title: undefined,
          description: undefined,
          arguments: []
        },
        template: "Minimal content."
      });
    });
  });

  describe("promptExists", () => {
    it("should return true when prompt exists", async () => {
      const promptContent = `---
name: existing-prompt
---
Content.`;

      await fs.writeFile(path.join(promptsDir, "existing-prompt.md"), promptContent);

      const result = await repository.promptExists("existing-prompt");

      expect(result).toBe(true);
    });

    it("should return false when prompt does not exist", async () => {
      const result = await repository.promptExists("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("executePrompt", () => {
    beforeEach(async () => {
      // Create test prompts for execution
      const promptWithArgs = `---
name: prompt-with-args
title: Prompt with Arguments
description: A prompt that requires arguments
arguments:
  - name: message
    description: The message to display
    required: true
  - name: tone
    description: The tone of the message
    required: false
---
Say {{message}} in a {{tone}} tone.`;

      const promptNoArgs = `---
name: prompt-no-args
title: Simple Prompt
description: A prompt with no arguments
---
This is a simple message with no parameters.`;

      await fs.writeFile(path.join(promptsDir, "prompt-with-args.md"), promptWithArgs);
      await fs.writeFile(path.join(promptsDir, "prompt-no-args.md"), promptNoArgs);
    });

    it("should execute prompt with required arguments", async () => {
      const result = await repository.executePrompt("prompt-with-args", {
        message: "hello",
        tone: "friendly"
      });

      expect(result).toEqual({
        description: "A prompt that requires arguments",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Say hello in a friendly tone."
            }
          }
        ]
      });
    });

    it("should execute prompt with only required arguments", async () => {
      const result = await repository.executePrompt("prompt-with-args", {
        message: "hello"
      });

      expect(result).toEqual({
        description: "A prompt that requires arguments",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Say hello in a {{tone}} tone."
            }
          }
        ]
      });
    });

    it("should execute prompt with no arguments", async () => {
      const result = await repository.executePrompt("prompt-no-args");

      expect(result).toEqual({
        description: "A prompt with no arguments",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "This is a simple message with no parameters."
            }
          }
        ]
      });
    });

    it("should throw error when required arguments are missing", async () => {
      await expect(
        repository.executePrompt("prompt-with-args", { tone: "friendly" })
      ).rejects.toThrow("Required argument 'message' is missing");
    });

    it("should throw error when prompt does not exist", async () => {
      await expect(
        repository.executePrompt("non-existent")
      ).rejects.toThrow("Prompt 'non-existent' not found");
    });

    it("should handle arguments with special characters", async () => {
      const result = await repository.executePrompt("prompt-with-args", {
        message: "hello & goodbye!",
        tone: "very excited"
      });

      expect(result.messages[0].content.text).toBe(
        "Say hello & goodbye! in a very excited tone."
      );
    });

    it("should handle multiple replacements of the same parameter", async () => {
      const multiReplacePrompt = `---
name: multi-replace
arguments:
  - name: word
    required: true
---
{{word}} is a great {{word}}!`;

      await fs.writeFile(path.join(promptsDir, "multi-replace.md"), multiReplacePrompt);

      const result = await repository.executePrompt("multi-replace", {
        word: "testing"
      });

      expect(result.messages[0].content.text).toBe("testing is a great testing!");
    });
  });
});