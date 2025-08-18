import path from 'path';
import { FsProjectRepository } from '../../infra/filesystem/repositories/fs-project-repository.js';
import { FsFileRepository } from '../../infra/filesystem/repositories/fs-file-repository.js';
import { ListProjects } from '../../data/usecases/list-projects/list-projects.js';
import { ListProjectFiles } from '../../data/usecases/list-project-files/list-project-files.js';
import { ReadFile } from '../../data/usecases/read-file/read-file.js';

// Environment configuration
export const config = {
  memoryBankRoot: process.env.MEMORY_BANK_ROOT || path.join(process.cwd(), 'test-memory-bank'),
  port: process.env.PORT || 3000,
};

// Initialize repositories
const projectRepository = new FsProjectRepository(config.memoryBankRoot);
const fileRepository = new FsFileRepository(config.memoryBankRoot);

// Initialize use cases
export const listProjectsUseCase = new ListProjects(projectRepository);
export const listProjectFilesUseCase = new ListProjectFiles(fileRepository, projectRepository);
export const readFileUseCase = new ReadFile(fileRepository, projectRepository);

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

// Enhanced service that builds on existing use cases
export class MemoryBankService {
  
  async getProjects(): Promise<ProjectInfo[]> {
    const projectNames = await listProjectsUseCase.listProjects();
    const projects: ProjectInfo[] = [];
    
    for (const name of projectNames) {
      try {
        const files = await this.getProjectFiles(name);
        const projectPath = path.join(config.memoryBankRoot, name);
        const stats = await import('fs').then(fs => fs.promises.stat(projectPath));
        
        projects.push({
          name,
          lastModified: stats.mtime,
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
    
    return projects;
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
}

export const memoryBankService = new MemoryBankService();