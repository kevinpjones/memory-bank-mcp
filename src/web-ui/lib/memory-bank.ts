import path from 'path';
import { FsProjectRepository } from '../../infra/filesystem/repositories/fs-project-repository.js';
import { FsFileRepository } from '../../infra/filesystem/repositories/fs-file-repository.js';
import { FsPromptRepository } from '../../infra/filesystem/repositories/fs-prompt-repository.js';
import { ListProjects } from '../../data/usecases/list-projects/list-projects.js';
import { ListProjectFiles } from '../../data/usecases/list-project-files/list-project-files.js';
import { ReadFile } from '../../data/usecases/read-file/read-file.js';
import { ListPrompts } from '../../data/usecases/list-prompts/list-prompts.js';
import { GetPrompt } from '../../data/usecases/get-prompt/get-prompt.js';

// Environment configuration
export const config = {
  memoryBankRoot: process.env.MEMORY_BANK_ROOT || path.join(process.cwd(), 'test-memory-bank'),
  port: process.env.PORT || 3000,
};

// Initialize repositories
const projectRepository = new FsProjectRepository(config.memoryBankRoot);
const fileRepository = new FsFileRepository(config.memoryBankRoot);
const promptRepository = new FsPromptRepository(config.memoryBankRoot);

// Initialize use cases
export const listProjectsUseCase = new ListProjects(projectRepository);
export const listProjectFilesUseCase = new ListProjectFiles(fileRepository, projectRepository);
export const readFileUseCase = new ReadFile(fileRepository, projectRepository);
export const listPromptsUseCase = new ListPrompts(promptRepository);
export const getPromptUseCase = new GetPrompt(promptRepository);

// Additional interfaces for the web UI
export interface ProjectInfo {
  name: string;
  description?: string;
  lastModified: Date;
  fileCount: number;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isMarkdown: boolean;
}

export interface SearchResult {
  file: string;
  line: number;
  content: string;
  beforeContext: string[];
  afterContext: string[];
  matches: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalMatches: number;
  searchTime: number;
}

// Prompts-related interfaces for the web UI
export interface PromptInfo {
  name: string;
  title?: string;
  description?: string;
  arguments?: PromptArgument[];
  template: string;
  lastModified?: Date;
  size?: number;
}

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// Enhanced service that builds on existing use cases
export class MemoryBankService {
  
  async getProjects(): Promise<ProjectInfo[]> {
    const projectNames = await listProjectsUseCase.listProjects();
    const projects: ProjectInfo[] = [];
    
    for (const name of projectNames) {
      try {
        const files = await this.getProjectFiles(name);
        
        // Find the most recent file modification date within the project
        let mostRecentModification = new Date(0); // Start with epoch
        for (const file of files) {
          if (file.lastModified > mostRecentModification) {
            mostRecentModification = file.lastModified;
          }
        }
        
        // If no files exist, fall back to project directory modification time
        if (files.length === 0) {
          const projectPath = path.join(config.memoryBankRoot, name);
          const stats = await import('fs').then(fs => fs.promises.stat(projectPath));
          mostRecentModification = stats.mtime instanceof Date ? stats.mtime : new Date(stats.mtime);
        }
        
        projects.push({
          name,
          lastModified: mostRecentModification,
          fileCount: files.length,
          description: await this.getProjectDescription(name),
        });
      } catch (error) {
        console.warn(`Error processing project ${name}:`, error);
        projects.push({
          name,
          lastModified: new Date(),
          fileCount: 0,
        });
      }
    }
    
    // Sort projects by last modification date in reverse chronological order (most recent first)
    return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }
  
  async getProjectFiles(projectName: string): Promise<FileInfo[]> {
    const fileNames = await listProjectFilesUseCase.listProjectFiles({ projectName });
    const files: FileInfo[] = [];
    
    for (const fileName of fileNames) {
      try {
        const filePath = path.join(config.memoryBankRoot, projectName, fileName);
        const stats = await import('fs').then(fs => fs.promises.stat(filePath));
        
        files.push({
          name: fileName,
          path: fileName,
          size: stats.size,
          lastModified: stats.mtime,
          isMarkdown: fileName.toLowerCase().endsWith('.md'),
        });
      } catch (error) {
        console.warn(`Error processing file ${fileName}:`, error);
      }
    }
    
    return files;
  }
  
  async getFileContent(projectName: string, fileName: string): Promise<string | null> {
    return await readFileUseCase.readFile({ projectName, fileName });
  }
  
  private async getProjectDescription(projectName: string): Promise<string | undefined> {
    try {
      // Try to read project description from projectbrief.md or README.md
      const briefContent = await this.getFileContent(projectName, 'projectbrief.md');
      if (briefContent) {
        // Extract first paragraph or description from markdown
        const lines = briefContent.split('\n');
        const firstParagraph = lines.find(line => line.trim() && !line.startsWith('#'));
        return firstParagraph?.trim().substring(0, 200);
      }
      
      const readmeContent = await this.getFileContent(projectName, 'README.md');
      if (readmeContent) {
        const lines = readmeContent.split('\n');
        const firstParagraph = lines.find(line => line.trim() && !line.startsWith('#'));
        return firstParagraph?.trim().substring(0, 200);
      }
    } catch {
      // Ignore errors when trying to read description files
    }
    return undefined;
  }
  
  async searchInProject(
    projectName: string, 
    query: string, 
    caseSensitive: boolean = false
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const results: SearchResult[] = [];
    let totalMatches = 0;
    
    try {
      const files = await this.getProjectFiles(projectName);
      const searchRegex = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        caseSensitive ? 'g' : 'gi'
      );
      
      for (const file of files) {
        const content = await this.getFileContent(projectName, file.name);
        if (!content) continue;
        
        const lines = content.split('\n');
        let fileMatches = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = Array.from(line.matchAll(searchRegex));
          
          if (matches.length > 0) {
            fileMatches += matches.length;
            
            const beforeContext = lines.slice(Math.max(0, i - 3), i);
            const afterContext = lines.slice(i + 1, Math.min(lines.length, i + 4));
            
            results.push({
              file: file.name,
              line: i + 1,
              content: line,
              beforeContext,
              afterContext,
              matches: matches.length,
            });
          }
        }
        
        totalMatches += fileMatches;
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    
    const searchTime = Date.now() - startTime;
    
    return {
      query,
      results,
      totalMatches,
      searchTime,
    };
  }
  
  // Prompts functionality
  async getPrompts(): Promise<PromptInfo[]> {
    const promptNames = await listPromptsUseCase.listPrompts();
    const prompts: PromptInfo[] = [];
    
    for (const prompt of promptNames) {
      try {
        const promptData = await promptRepository.getPrompt(prompt.name);
        
        // Try to get file stats if possible
        let lastModified: Date | undefined;
        let size: number | undefined;
        try {
          const promptPath = path.join(config.memoryBankRoot, '.prompts', `${prompt.name}.md`);
          const stats = await import('fs').then(fs => fs.promises.stat(promptPath));
          lastModified = stats.mtime instanceof Date ? stats.mtime : new Date(stats.mtime);
          size = stats.size;
          
          // Validate the date
          if (isNaN(lastModified.getTime())) {
            lastModified = undefined;
          }
        } catch {
          // Ignore file stats errors
        }
        
        prompts.push({
          name: prompt.name,
          title: prompt.title,
          description: prompt.description,
          arguments: promptData.metadata.arguments,
          template: promptData.template,
          lastModified,
          size,
        });
      } catch (error) {
        console.warn(`Error processing prompt ${prompt.name}:`, error);
        prompts.push({
          name: prompt.name,
          title: prompt.title,
          description: prompt.description,
          arguments: [],
          template: '',
        });
      }
    }
    
    return prompts.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getPrompt(name: string): Promise<PromptInfo | null> {
    try {
      const promptData = await promptRepository.getPrompt(name);
      
      // Try to get file stats if possible
      let lastModified: Date | undefined;
      let size: number | undefined;
      try {
        const promptPath = path.join(config.memoryBankRoot, '.prompts', `${name}.md`);
        const stats = await import('fs').then(fs => fs.promises.stat(promptPath));
        lastModified = stats.mtime instanceof Date ? stats.mtime : new Date(stats.mtime);
        size = stats.size;
        
        // Validate the date
        if (isNaN(lastModified.getTime())) {
          lastModified = undefined;
        }
      } catch {
        // Ignore file stats errors
      }
      
      return {
        name,
        title: promptData.metadata.title,
        description: promptData.metadata.description,
        arguments: promptData.metadata.arguments,
        template: promptData.template,
        lastModified,
        size,
      };
    } catch (error) {
      console.warn(`Error getting prompt ${name}:`, error);
      return null;
    }
  }
  
  async getPromptRawContent(name: string): Promise<string | null> {
    try {
      const promptPath = path.join(config.memoryBankRoot, '.prompts', `${name}.md`);
      const fs = await import('fs');
      return await fs.promises.readFile(promptPath, 'utf-8');
    } catch (error) {
      console.warn(`Error reading raw prompt content for ${name}:`, error);
      return null;
    }
  }
  
  async savePromptRawContent(name: string, content: string): Promise<void> {
    try {
      const fs = await import('fs');
      const promptsDir = path.join(config.memoryBankRoot, '.prompts');
      const promptPath = path.join(promptsDir, `${name}.md`);
      
      // Ensure .prompts directory exists
      await fs.promises.mkdir(promptsDir, { recursive: true });
      
      // Write the content
      await fs.promises.writeFile(promptPath, content, 'utf-8');
    } catch (error) {
      console.error(`Error saving prompt content for ${name}:`, error);
      throw error;
    }
  }
}

export const memoryBankService = new MemoryBankService();