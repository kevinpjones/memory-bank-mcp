import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { PromptRepository } from "../../../data/protocols/prompt-repository.js";
import { Prompt, PromptFileContent, PromptResult, PromptMessage, TextContent } from "../../../domain/entities/index.js";

/**
 * Filesystem implementation of the PromptRepository protocol
 * Stores prompts as Markdown files with YAML frontmatter in a .prompts directory
 */
export class FsPromptRepository implements PromptRepository {
  private readonly promptsDir: string;

  /**
   * Creates a new FsPromptRepository
   * @param rootDir The root directory where the .prompts folder will be located
   */
  constructor(private readonly rootDir: string) {
    this.promptsDir = path.join(rootDir, ".prompts");
  }

  /**
   * Ensures the .prompts directory exists
   * @private
   */
  private async ensurePromptsDir(): Promise<void> {
    await fs.ensureDir(this.promptsDir);
  }

  /**
   * Builds a path to a prompt file
   * @param promptName The name of the prompt
   * @returns The full path to the prompt file
   * @private
   */
  private buildPromptPath(promptName: string): string {
    return path.join(this.promptsDir, `${promptName}.md`);
  }

  /**
   * Lists all available prompts
   * @returns An array of Prompt objects with metadata
   */
  async listPrompts(): Promise<Prompt[]> {
    await this.ensurePromptsDir();
    
    try {
      const entries = await fs.readdir(this.promptsDir, { withFileTypes: true });
      const prompts: Prompt[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const promptName = entry.name.replace('.md', '');
          try {
            const promptContent = await this.getPrompt(promptName);
            prompts.push({
              name: promptContent.metadata.name,
              title: promptContent.metadata.title,
              description: promptContent.metadata.description,
              arguments: promptContent.metadata.arguments
            });
          } catch (error) {
            // Skip invalid prompt files
            console.warn(`Skipping invalid prompt file: ${entry.name}`, error);
          }
        }
      }

      return prompts;
    } catch (error) {
      return [];
    }
  }

  /**
   * Gets a specific prompt by name
   * @param name The name of the prompt
   * @returns The prompt file content with metadata and template
   */
  async getPrompt(name: string): Promise<PromptFileContent> {
    const promptPath = this.buildPromptPath(name);
    
    if (!(await fs.pathExists(promptPath))) {
      throw new Error(`Prompt '${name}' not found`);
    }

    const fileContent = await fs.readFile(promptPath, 'utf8');
    const { data: metadata, content: template } = matter(fileContent);

    // Validate required metadata
    if (!metadata.name) {
      throw new Error(`Prompt '${name}' missing required 'name' in metadata`);
    }

    return {
      metadata: {
        name: metadata.name,
        title: metadata.title,
        description: metadata.description,
        arguments: metadata.arguments || []
      },
      template
    };
  }

  /**
   * Checks if a prompt exists
   * @param name The name of the prompt
   * @returns True if the prompt exists, false otherwise
   */
  async promptExists(name: string): Promise<boolean> {
    const promptPath = this.buildPromptPath(name);
    return await fs.pathExists(promptPath);
  }

  /**
   * Executes a prompt with provided arguments, performing parameter substitution
   * @param name The name of the prompt
   * @param args The arguments to substitute into the template
   * @returns The rendered prompt result with messages
   */
  async executePrompt(name: string, args: Record<string, any> = {}): Promise<PromptResult> {
    const promptContent = await this.getPrompt(name);
    
    // Validate required arguments
    const requiredArgs = promptContent.metadata.arguments?.filter(arg => arg.required) || [];
    for (const arg of requiredArgs) {
      if (!(arg.name in args)) {
        throw new Error(`Required argument '${arg.name}' is missing`);
      }
    }

    // Perform parameter substitution
    let renderedTemplate = promptContent.template;
    for (const [key, value] of Object.entries(args)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      renderedTemplate = renderedTemplate.replace(placeholder, String(value));
    }

    // Create a single user message with the rendered template
    const message: PromptMessage = {
      role: "user",
      content: {
        type: "text",
        text: renderedTemplate
      } as TextContent
    };

    return {
      description: promptContent.metadata.description,
      messages: [message]
    };
  }
}