import { PromptRepository } from "../../../src/data/protocols/prompt-repository.js";
import { Prompt, PromptFileContent, PromptResult, PromptArgument } from "../../../src/domain/entities/index.js";

export class MockPromptRepository implements PromptRepository {
  private prompts: Map<string, PromptFileContent> = new Map();

  constructor() {
    // Initialize with some test prompts
    this.prompts.set("test-prompt", {
      metadata: {
        name: "test-prompt",
        title: "Test Prompt",
        description: "A simple test prompt",
        arguments: [
          {
            name: "message",
            description: "The message to display",
            required: true
          },
          {
            name: "tone",
            description: "The tone of the message",
            required: false
          }
        ]
      },
      template: "Say {{message}} in a {{tone}} tone."
    });

    this.prompts.set("no-args-prompt", {
      metadata: {
        name: "no-args-prompt",
        title: "No Arguments Prompt",
        description: "A prompt with no arguments",
        arguments: []
      },
      template: "This is a simple prompt with no parameters."
    });
  }

  async listPrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values()).map(content => ({
      name: content.metadata.name,
      title: content.metadata.title,
      description: content.metadata.description,
      arguments: content.metadata.arguments
    }));
  }

  async getPrompt(name: string): Promise<PromptFileContent> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt '${name}' not found`);
    }
    return prompt;
  }

  async promptExists(name: string): Promise<boolean> {
    return this.prompts.has(name);
  }

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

    return {
      description: promptContent.metadata.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: renderedTemplate
          }
        }
      ]
    };
  }

  // Test helper methods
  addPrompt(name: string, content: PromptFileContent): void {
    this.prompts.set(name, content);
  }

  removePrompt(name: string): void {
    this.prompts.delete(name);
  }

  clear(): void {
    this.prompts.clear();
  }
}