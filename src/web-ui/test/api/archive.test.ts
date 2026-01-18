import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/projects/[id]/archive/route';
import { NextRequest } from 'next/server';

// Mock the memory bank service
const mockGetProjects = vi.fn();
vi.mock('@/lib/memory-bank', () => ({
  memoryBankService: {
    getProjects: mockGetProjects,
  },
  config: {
    memoryBankRoot: '/test/memory-bank',
  },
}));

// Mock fs-extra
const mockEnsureDir = vi.fn();
const mockMove = vi.fn();
const mockPathExists = vi.fn();
vi.mock('fs-extra', () => ({
  ensureDir: mockEnsureDir,
  move: mockMove,
  pathExists: mockPathExists,
}));

// Mock path
vi.mock('path', () => ({
  join: (...args: string[]) => args.join('/'),
}));

describe('/api/projects/[id]/archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureDir.mockResolvedValue(undefined);
    mockMove.mockResolvedValue(undefined);
    mockPathExists.mockResolvedValue(true); // Default: history exists
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST', () => {
    it('successfully archives an existing project with history', async () => {
      // Arrange
      const mockProjects = [
        { name: 'test-project', fileCount: 5, lastModified: new Date() },
        { name: 'another-project', fileCount: 3, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Project 'test-project' has been archived successfully",
        archivedAs: expect.stringMatching(/test-project-ARCHIVED-/),
      });
      
      expect(mockEnsureDir).toHaveBeenCalledWith('/test/memory-bank/.archive');
      
      // Verify project directory is moved
      expect(mockMove).toHaveBeenCalledWith(
        '/test/memory-bank/test-project',
        expect.stringMatching(/\/test\/memory-bank\/\.archive\/test-project-ARCHIVED-/)
      );
      
      // Verify history directory is also moved
      expect(mockPathExists).toHaveBeenCalledWith('/test/memory-bank/.history/test-project');
      expect(mockMove).toHaveBeenCalledWith(
        '/test/memory-bank/.history/test-project',
        expect.stringMatching(/\/test\/memory-bank\/\.archive\/test-project-ARCHIVED-.*\.history/)
      );
      
      expect(mockMove).toHaveBeenCalledTimes(2);
    });

    it('successfully archives project without history', async () => {
      // Arrange
      const mockProjects = [
        { name: 'test-project', fileCount: 5, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      mockPathExists.mockResolvedValue(false); // No history exists
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify only project directory is moved (no history)
      expect(mockMove).toHaveBeenCalledTimes(1);
      expect(mockMove).toHaveBeenCalledWith(
        '/test/memory-bank/test-project',
        expect.stringMatching(/\/test\/memory-bank\/\.archive\/test-project-ARCHIVED-/)
      );
    });

    it('returns 404 when project does not exist', async () => {
      // Arrange
      mockGetProjects.mockResolvedValue([
        { name: 'other-project', fileCount: 3, lastModified: new Date() },
      ]);
      
      const request = new NextRequest('http://localhost/api/projects/nonexistent/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'nonexistent' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Project not found',
      });
      
      expect(mockEnsureDir).not.toHaveBeenCalled();
      expect(mockMove).not.toHaveBeenCalled();
    });

    it('returns 400 when project name is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/projects//archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: '' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Project name is required',
      });
    });

    it('handles filesystem errors gracefully', async () => {
      // Arrange
      const mockProjects = [
        { name: 'test-project', fileCount: 5, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      mockMove.mockRejectedValue(new Error('Permission denied'));
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to archive project',
        message: 'Permission denied',
      });
    });

    it('handles memory bank service errors', async () => {
      // Arrange
      mockGetProjects.mockRejectedValue(new Error('Database connection failed'));
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to archive project',
        message: 'Database connection failed',
      });
    });

    it('handles URL-encoded project names correctly', async () => {
      // Arrange
      const mockProjects = [
        { name: 'My Special Project', fileCount: 5, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      
      const request = new NextRequest('http://localhost/api/projects/My%20Special%20Project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'My%20Special%20Project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Project 'My%20Special%20Project' has been archived");
      
      expect(mockMove).toHaveBeenCalledWith(
        '/test/memory-bank/My%20Special%20Project',
        expect.stringMatching(/\/test\/memory-bank\/\.archive\/My%20Special%20Project-ARCHIVED-/)
      );
    });

    it('rolls back project move when history move fails', async () => {
      // Arrange
      const mockProjects = [
        { name: 'test-project', fileCount: 5, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      mockPathExists.mockResolvedValue(true); // History exists
      
      // First move (project) succeeds, second move (history) fails, third move (rollback) succeeds
      mockMove
        .mockResolvedValueOnce(undefined)  // Project move succeeds
        .mockRejectedValueOnce(new Error('Disk full'))  // History move fails
        .mockResolvedValueOnce(undefined); // Rollback succeeds
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to archive project history',
        message: 'Disk full',
      });
      
      // Verify rollback was attempted (3 move calls: project, history, rollback)
      expect(mockMove).toHaveBeenCalledTimes(3);
    });

    it('returns critical error when both history move and rollback fail', async () => {
      // Arrange
      const mockProjects = [
        { name: 'test-project', fileCount: 5, lastModified: new Date() },
      ];
      
      mockGetProjects.mockResolvedValue(mockProjects);
      mockPathExists.mockResolvedValue(true); // History exists
      
      // First move (project) succeeds, second move (history) fails, third move (rollback) also fails
      mockMove
        .mockResolvedValueOnce(undefined)  // Project move succeeds
        .mockRejectedValueOnce(new Error('Disk full'))  // History move fails
        .mockRejectedValueOnce(new Error('Permission denied')); // Rollback fails
      
      const request = new NextRequest('http://localhost/api/projects/test-project/archive', {
        method: 'POST',
      });
      
      const params = Promise.resolve({ id: 'test-project' });

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Critical archive failure');
      expect(data.message).toContain('Manual intervention required');
      expect(data.message).toContain('test-project-ARCHIVED-');
      
      // Verify all 3 move calls were made
      expect(mockMove).toHaveBeenCalledTimes(3);
    });
  });
});