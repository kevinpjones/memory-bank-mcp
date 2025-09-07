import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryBankService } from '../../lib/memory-bank';
import { FsPromptRepository } from '../../../infra/filesystem/repositories/fs-prompt-repository';

// Mock the dependencies
vi.mock('../../../data/usecases/list-prompts/list-prompts.js', () => ({
  ListPrompts: vi.fn().mockImplementation(() => ({
    listPrompts: vi.fn()
  }))
}));

vi.mock('../../../infra/filesystem/repositories/fs-prompt-repository.js', () => ({
  FsPromptRepository: vi.fn().mockImplementation(() => ({
    getPrompt: vi.fn(),
    executePrompt: vi.fn(),
    promptExists: vi.fn()
  }))
}));

// Mock fs module
const mockStats = {
  mtime: new Date('2023-12-01T10:00:00Z'),
  size: 1024,
  isFile: () => true,
  isDirectory: () => false
};

const mockInvalidStats = {
  mtime: 'invalid-date',
  size: 512,
  isFile: () => true,
  isDirectory: () => false
};

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      stat: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn()
    }
  };
});

describe('MemoryBankService - Prompts Functionality', () => {
  let service: MemoryBankService;
  let mockFsPromises: any;
  let mockPromptRepository: any;
  let mockListPromptsUseCase: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock the file system
    const fs = await import('fs');
    mockFsPromises = fs.promises as any;
    
    // Create service instance
    service = new MemoryBankService();
    
    // Get mock instances
    mockPromptRepository = (service as any).promptRepository || {
      getPrompt: vi.fn(),
      executePrompt: vi.fn(),
      promptExists: vi.fn()
    };
    
    mockListPromptsUseCase = (service as any).listPromptsUseCase || {
      listPrompts: vi.fn()
    };
    
    // Set up the service with mock repositories manually for testing
    Object.defineProperty(service, 'promptRepository', {
      value: mockPromptRepository,
      writable: true
    });
    Object.defineProperty(service, 'listPromptsUseCase', {
      value: mockListPromptsUseCase,
      writable: true
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPrompts', () => {
    beforeEach(() => {
      // Mock the service methods properly 
      vi.spyOn(service, 'getPrompts').mockRestore();
      
      // Access the private properties using bracket notation for testing
      (service as any).listPromptsUseCase = mockListPromptsUseCase;
      (service as any).promptRepository = mockPromptRepository;
    });

    it('should return formatted prompts with valid dates', async () => {
      // Arrange
      const mockPromptNames = [
        { name: 'test-prompt', title: 'Test Prompt', description: 'A test prompt' }
      ];
      
      const mockPromptData = {
        metadata: {
          name: 'test-prompt',
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: [
            { name: 'input', description: 'Input text', required: true }
          ]
        },
        template: 'This is a test template with {{input}}'
      };
      
      mockListPromptsUseCase.listPrompts.mockResolvedValue(mockPromptNames);
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockResolvedValue(mockStats);

      // Act
      const result = await service.getPrompts();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'test-prompt',
        title: 'Test Prompt', 
        description: 'A test prompt',
        arguments: mockPromptData.metadata.arguments,
        template: 'This is a test template with {{input}}',
        lastModified: mockStats.mtime,
        size: mockStats.size
      });
    });

    it('should handle invalid dates gracefully', async () => {
      // Arrange
      const mockPromptNames = [
        { name: 'test-prompt', title: 'Test Prompt', description: 'A test prompt' }
      ];
      
      const mockPromptData = {
        metadata: {
          name: 'test-prompt',
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: []
        },
        template: 'Test template'
      };
      
      mockListPromptsUseCase.listPrompts.mockResolvedValue(mockPromptNames);
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockResolvedValue(mockInvalidStats);

      // Act
      const result = await service.getPrompts();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].lastModified).toBeUndefined();
      expect(result[0].size).toBe(512);
    });

    it('should handle file stat errors gracefully', async () => {
      // Arrange
      const mockPromptNames = [
        { name: 'test-prompt', title: 'Test Prompt', description: 'A test prompt' }
      ];
      
      const mockPromptData = {
        metadata: {
          name: 'test-prompt',
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: []
        },
        template: 'Test template'
      };
      
      mockListPromptsUseCase.listPrompts.mockResolvedValue(mockPromptNames);
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await service.getPrompts();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].lastModified).toBeUndefined();
      expect(result[0].size).toBeUndefined();
    });

    it('should handle prompt repository errors gracefully', async () => {
      // Arrange
      const mockPromptNames = [
        { name: 'test-prompt', title: 'Test Prompt', description: 'A test prompt' },
        { name: 'error-prompt', title: 'Error Prompt', description: 'This will error' }
      ];
      
      const mockPromptData = {
        metadata: {
          name: 'test-prompt',
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: []
        },
        template: 'Test template'
      };
      
      mockListPromptsUseCase.listPrompts.mockResolvedValue(mockPromptNames);
      mockPromptRepository.getPrompt.mockImplementation((name: string) => {
        if (name === 'error-prompt') {
          throw new Error('Prompt not found');
        }
        return Promise.resolve(mockPromptData);
      });
      mockFsPromises.stat.mockResolvedValue(mockStats);

      // Act
      const result = await service.getPrompts();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test-prompt');
      expect(result[1].name).toBe('error-prompt');
      expect(result[1].template).toBe(''); // Fallback value
    });

    it('should sort prompts alphabetically by name', async () => {
      // Arrange
      const mockPromptNames = [
        { name: 'zebra-prompt', title: 'Zebra', description: 'Last alphabetically' },
        { name: 'alpha-prompt', title: 'Alpha', description: 'First alphabetically' }
      ];
      
      const mockPromptData = {
        metadata: { name: '', title: '', description: '', arguments: [] },
        template: 'Test'
      };
      
      mockListPromptsUseCase.listPrompts.mockResolvedValue(mockPromptNames);
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockResolvedValue(mockStats);

      // Act
      const result = await service.getPrompts();

      // Assert
      expect(result[0].name).toBe('alpha-prompt');
      expect(result[1].name).toBe('zebra-prompt');
    });
  });

  describe('getPrompt', () => {
    it('should return a single prompt with valid data', async () => {
      // Arrange
      const mockPromptData = {
        metadata: {
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: [
            { name: 'input', description: 'Input text', required: true }
          ]
        },
        template: 'This is {{input}}'
      };
      
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockResolvedValue(mockStats);

      // Act
      const result = await service.getPrompt('test-prompt');

      // Assert
      expect(result).toEqual({
        name: 'test-prompt',
        title: 'Test Prompt',
        description: 'A test prompt',
        arguments: mockPromptData.metadata.arguments,
        template: 'This is {{input}}',
        lastModified: mockStats.mtime,
        size: mockStats.size
      });
    });

    it('should return null when prompt not found', async () => {
      // Arrange
      mockPromptRepository.getPrompt.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await service.getPrompt('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid dates in single prompt', async () => {
      // Arrange
      const mockPromptData = {
        metadata: {
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: []
        },
        template: 'Template'
      };
      
      mockPromptRepository.getPrompt.mockResolvedValue(mockPromptData);
      mockFsPromises.stat.mockResolvedValue(mockInvalidStats);

      // Act
      const result = await service.getPrompt('test-prompt');

      // Assert
      expect(result?.lastModified).toBeUndefined();
      expect(result?.size).toBe(512);
    });
  });

  describe('getPromptRawContent', () => {
    it('should return raw file content', async () => {
      // Arrange
      const mockContent = '---\nname: test\n---\nContent here';
      mockFsPromises.readFile.mockResolvedValue(mockContent);

      // Act
      const result = await service.getPromptRawContent('test-prompt');

      // Assert
      expect(result).toBe(mockContent);
      expect(mockFsPromises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-prompt.md'),
        'utf-8'
      );
    });

    it('should return null when file not found', async () => {
      // Arrange
      mockFsPromises.readFile.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await service.getPromptRawContent('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('savePromptRawContent', () => {
    it('should save content successfully', async () => {
      // Arrange
      const content = '---\nname: test\n---\nNew content';
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);

      // Act
      await service.savePromptRawContent('test-prompt', content);

      // Assert
      expect(mockFsPromises.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.prompts'),
        { recursive: true }
      );
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-prompt.md'),
        content,
        'utf-8'
      );
    });

    it('should propagate errors when save fails', async () => {
      // Arrange
      const content = 'test content';
      const error = new Error('Permission denied');
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockRejectedValue(error);

      // Act & Assert
      await expect(service.savePromptRawContent('test-prompt', content))
        .rejects.toThrow('Permission denied');
    });
  });
});

// Helper function tests
describe('Date formatting utilities', () => {
  // These will be tested in the component tests, but we can add some here too
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch {
      return 'Unknown';
    }
  };

  it('should format valid dates correctly', () => {
    const date = new Date('2023-12-01T10:30:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/Dec \d+, 2023/);
  });

  it('should return "Unknown" for undefined dates', () => {
    expect(formatDate(undefined)).toBe('Unknown');
  });

  it('should return "Unknown" for invalid dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('Unknown');
  });

  it('should handle string dates that can be parsed', () => {
    const result = formatDate(new Date('2023-12-01T10:30:00Z'));
    expect(result).toMatch(/Dec \d+, 2023/);
  });
});

// MemoryBankService projects functionality tests
describe('MemoryBankService - Projects Functionality', () => {
  let service: MemoryBankService;
  let mockListProjectsUseCase: any;
  let mockListProjectFilesUseCase: any;
  let mockFsPromises: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock the file system
    const fs = await import('fs');
    mockFsPromises = fs.promises as any;
    
    service = new MemoryBankService();
    
    // Create mock use cases
    mockListProjectsUseCase = {
      listProjects: vi.fn(),
    };
    
    mockListProjectFilesUseCase = {
      listProjectFiles: vi.fn(),
    };
    
    // Set up mocks on service instance
    Object.defineProperty(service, 'listProjectsUseCase', {
      value: mockListProjectsUseCase,
      writable: true
    });
    Object.defineProperty(service, 'listProjectFilesUseCase', {
      value: mockListProjectFilesUseCase,
      writable: true
    });
    
    // Mock getProjectDescription method
    vi.spyOn(service as any, 'getProjectDescription').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProjects', () => {
    it('should sort projects by most recent file modification date', async () => {
      // Arrange
      const now = new Date();
      const oldDate = new Date(now.getTime() - 86400000); // 1 day ago
      const newerDate = new Date(now.getTime() - 43200000); // 12 hours ago
      
      mockListProjectsUseCase.listProjects.mockResolvedValue([
        'old-project',
        'newer-project',
        'newest-project'
      ]);
      
      // Mock file listings
      mockListProjectFilesUseCase.listProjectFiles.mockImplementation(({ projectName }: { projectName: string }) => {
        if (projectName === 'old-project') {
          return Promise.resolve(['old-file.md']);
        }
        if (projectName === 'newer-project') {
          return Promise.resolve(['newer-file.md']);
        }
        if (projectName === 'newest-project') {
          return Promise.resolve(['newest-file.md']);
        }
        return Promise.resolve([]);
      });
      
      // Mock file stats
      mockFsPromises.stat.mockImplementation((filePath: string) => {
        if (filePath.includes('old-file.md')) {
          return Promise.resolve({ size: 100, mtime: oldDate });
        }
        if (filePath.includes('newer-file.md')) {
          return Promise.resolve({ size: 200, mtime: newerDate });
        }
        if (filePath.includes('newest-file.md')) {
          return Promise.resolve({ size: 300, mtime: now });
        }
        return Promise.resolve({ size: 0, mtime: oldDate });
      });

      // Act
      const result = await service.getProjects();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('newest-project');
      expect(result[1].name).toBe('newer-project');
      expect(result[2].name).toBe('old-project');
    });

    it('should use most recent file modification date within each project', async () => {
      // Arrange
      const baseDate = new Date('2024-01-01');
      const recentDate = new Date('2024-01-10');
      
      mockListProjectsUseCase.listProjects.mockResolvedValue(['test-project']);
      
      mockListProjectFilesUseCase.listProjectFiles.mockResolvedValue([
        'old-file.md',
        'recent-file.md'
      ]);
      
      mockFsPromises.stat.mockImplementation((filePath: string) => {
        if (filePath.includes('old-file.md')) {
          return Promise.resolve({ size: 100, mtime: baseDate });
        }
        if (filePath.includes('recent-file.md')) {
          return Promise.resolve({ size: 200, mtime: recentDate });
        }
        return Promise.resolve({ size: 0, mtime: baseDate });
      });

      // Act
      const result = await service.getProjects();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].lastModified).toEqual(recentDate);
    });

    it('should fallback to project directory mtime when no files exist', async () => {
      // Arrange
      const projectDirDate = new Date('2024-01-05');
      
      mockListProjectsUseCase.listProjects.mockResolvedValue(['empty-project']);
      
      mockListProjectFilesUseCase.listProjectFiles.mockResolvedValue([]);
      
      mockFsPromises.stat.mockResolvedValue({ mtime: projectDirDate });

      // Act  
      const result = await service.getProjects();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].lastModified).toEqual(projectDirDate);
    });

    it('should handle projects with errors gracefully', async () => {
      // Arrange
      mockListProjectsUseCase.listProjects.mockResolvedValue([
        'working-project',
        'error-project'
      ]);
      
      mockListProjectFilesUseCase.listProjectFiles.mockImplementation(({ projectName }: { projectName: string }) => {
        if (projectName === 'working-project') {
          return Promise.resolve(['file.md']);
        }
        throw new Error('Project access denied');
      });
      
      mockFsPromises.stat.mockResolvedValue({ size: 100, mtime: new Date() });

      // Act
      const result = await service.getProjects();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.find(p => p.name === 'working-project')).toBeDefined();
      expect(result.find(p => p.name === 'error-project')).toBeDefined();
      expect(result.find(p => p.name === 'error-project')?.fileCount).toBe(0);
    });
  });
});