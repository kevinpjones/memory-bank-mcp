import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/prompts/route';
import { GET as GetPrompt, PUT as PutPromptRaw } from '../../app/api/prompts/[name]/raw/route';
import { GET as GetPromptDetails } from '../../app/api/prompts/[name]/route';

// Mock the memory bank service
const mockMemoryBankService = {
  getPrompts: vi.fn(),
  getPrompt: vi.fn(),
  getPromptRawContent: vi.fn(),
  savePromptRawContent: vi.fn()
};

vi.mock('../../lib/memory-bank', () => ({
  memoryBankService: mockMemoryBankService
}));

describe('API Routes - Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/prompts', () => {
    it('should return prompts list successfully', async () => {
      // Arrange
      const mockPrompts = [
        {
          name: 'test-prompt',
          title: 'Test Prompt',
          description: 'A test prompt',
          arguments: [{ name: 'input', required: true }],
          template: 'Test {{input}}',
          lastModified: new Date('2023-12-01T10:00:00Z'),
          size: 1024
        }
      ];
      
      mockMemoryBankService.getPrompts.mockResolvedValue(mockPrompts);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockPrompts,
        count: 1
      });
      expect(mockMemoryBankService.getPrompts).toHaveBeenCalledOnce();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Service unavailable');
      mockMemoryBankService.getPrompts.mockRejectedValue(error);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to fetch prompts',
        message: 'Service unavailable'
      });
    });

    it('should handle unknown errors', async () => {
      // Arrange
      mockMemoryBankService.getPrompts.mockRejectedValue('Unknown error');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to fetch prompts',
        message: 'Unknown error'
      });
    });
  });

  describe('GET /api/prompts/[name]', () => {
    it('should return prompt details successfully', async () => {
      // Arrange
      const mockPrompt = {
        name: 'test-prompt',
        title: 'Test Prompt',
        description: 'A test prompt',
        arguments: [{ name: 'input', required: true }],
        template: 'Test {{input}}',
        lastModified: new Date('2023-12-01T10:00:00Z'),
        size: 1024
      };
      
      mockMemoryBankService.getPrompt.mockResolvedValue(mockPrompt);
      
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt');

      // Act
      const response = await GetPromptDetails(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockPrompt
      });
      expect(mockMemoryBankService.getPrompt).toHaveBeenCalledWith('test-prompt');
    });

    it('should return 404 when prompt not found', async () => {
      // Arrange
      mockMemoryBankService.getPrompt.mockResolvedValue(null);
      
      const params = Promise.resolve({ name: 'nonexistent' });
      const request = new NextRequest('http://localhost:3000/api/prompts/nonexistent');

      // Act
      const response = await GetPromptDetails(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Prompt not found',
        message: 'Prompt "nonexistent" does not exist'
      });
    });

    it('should handle URL encoded names', async () => {
      // Arrange
      const mockPrompt = {
        name: 'test-prompt-with-spaces',
        title: 'Test Prompt',
        template: 'Test'
      };
      
      mockMemoryBankService.getPrompt.mockResolvedValue(mockPrompt);
      
      const params = Promise.resolve({ name: 'test-prompt%20with%20spaces' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt%20with%20spaces');

      // Act
      const response = await GetPromptDetails(request, { params });

      // Assert
      expect(response.status).toBe(200);
      expect(mockMemoryBankService.getPrompt).toHaveBeenCalledWith('test-prompt with spaces');
    });
  });

  describe('GET /api/prompts/[name]/raw', () => {
    it('should return raw content successfully', async () => {
      // Arrange
      const mockContent = '---\nname: test\n---\nContent here';
      mockMemoryBankService.getPromptRawContent.mockResolvedValue(mockContent);
      
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw');

      // Act
      const response = await GetPrompt(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          name: 'test-prompt',
          content: mockContent
        }
      });
      expect(mockMemoryBankService.getPromptRawContent).toHaveBeenCalledWith('test-prompt');
    });

    it('should return 404 when raw content not found', async () => {
      // Arrange
      mockMemoryBankService.getPromptRawContent.mockResolvedValue(null);
      
      const params = Promise.resolve({ name: 'nonexistent' });
      const request = new NextRequest('http://localhost:3000/api/prompts/nonexistent/raw');

      // Act
      const response = await GetPrompt(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Prompt not found',
        message: 'Prompt "nonexistent" does not exist'
      });
    });
  });

  describe('PUT /api/prompts/[name]/raw', () => {
    it('should save content successfully', async () => {
      // Arrange
      const content = '---\nname: test\n---\nNew content';
      mockMemoryBankService.savePromptRawContent.mockResolvedValue(undefined);
      
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw', {
        method: 'PUT',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await PutPromptRaw(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          name: 'test-prompt',
          message: 'Prompt saved successfully'
        }
      });
      expect(mockMemoryBankService.savePromptRawContent).toHaveBeenCalledWith('test-prompt', content);
    });

    it('should return 400 for invalid content type', async () => {
      // Arrange
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw', {
        method: 'PUT',
        body: JSON.stringify({ content: 123 }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await PutPromptRaw(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid request',
        message: 'Content must be a string'
      });
    });

    it('should handle save errors', async () => {
      // Arrange
      const content = 'test content';
      const error = new Error('Permission denied');
      mockMemoryBankService.savePromptRawContent.mockRejectedValue(error);
      
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw', {
        method: 'PUT',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await PutPromptRaw(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to save prompt content',
        message: 'Permission denied'
      });
    });

    it('should handle missing content field', async () => {
      // Arrange
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await PutPromptRaw(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid request',
        message: 'Content must be a string'
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed JSON in PUT requests', async () => {
      // Arrange  
      const params = Promise.resolve({ name: 'test-prompt' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt/raw', {
        method: 'PUT',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      // Act
      const response = await PutPromptRaw(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to save prompt content');
    });

    it('should handle special characters in prompt names', async () => {
      // Arrange
      const mockPrompt = { name: 'test-prompt-$pecial!', template: 'test' };
      mockMemoryBankService.getPrompt.mockResolvedValue(mockPrompt);
      
      const params = Promise.resolve({ name: 'test-prompt-%24pecial%21' });
      const request = new NextRequest('http://localhost:3000/api/prompts/test-prompt-%24pecial%21');

      // Act
      const response = await GetPromptDetails(request, { params });

      // Assert
      expect(response.status).toBe(200);
      expect(mockMemoryBankService.getPrompt).toHaveBeenCalledWith('test-prompt-$pecial!');
    });
  });
});