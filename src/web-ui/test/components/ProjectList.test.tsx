import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import ProjectList from '@/components/ProjectList';
import { ProjectInfo } from '@/lib/memory-bank';

// Create dates relative to current time for consistent testing
const now = new Date();
const today = new Date(now);
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 6);
const twoWeeksAgo = new Date(now);
twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

const mockProjects: ProjectInfo[] = [
  {
    name: 'Test Project 1',
    description: 'A test project for memory bank',
    lastModified: today,
    fileCount: 5,
  },
  {
    name: 'Another Project',
    description: 'Another project for testing',
    lastModified: yesterday,
    fileCount: 3,
  },
  {
    name: 'API Documentation',
    lastModified: lastWeek,
    fileCount: 10,
  },
  {
    name: 'Old Project',
    description: 'Project from two weeks ago',
    lastModified: twoWeeksAgo,
    fileCount: 2,
  },
];

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};

// Mock fetch for archive API
const mockFetch = vi.fn();

describe('ProjectList', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });
    
    // Mock fetch globally
    global.fetch = mockFetch;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Cleanup DOM
    document.body.innerHTML = '';
  });
  test('renders project list correctly', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('Memory Bank Projects')).toBeInTheDocument();
    expect(screen.getByText('Projects (4)')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Another Project')).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Old Project')).toBeInTheDocument();
  });

  test('displays project descriptions when available', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('A test project for memory bank')).toBeInTheDocument();
    expect(screen.getByText('Another project for testing')).toBeInTheDocument();
  });

  test('displays file counts correctly', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('5 files')).toBeInTheDocument();
    expect(screen.getByText('3 files')).toBeInTheDocument();
    expect(screen.getByText('10 files')).toBeInTheDocument();
    expect(screen.getByText('2 files')).toBeInTheDocument();
  });

  test('filters projects based on search input', async () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Another project for testing')).toBeInTheDocument();
    expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
    expect(screen.queryByText('Old Project')).not.toBeInTheDocument();
    
    expect(screen.getByText('2 of 4 projects shown')).toBeInTheDocument();
  });

  test('shows no results message when search yields no matches', () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No projects match your search')).toBeInTheDocument();
    expect(screen.getByText('clear the search')).toBeInTheDocument();
  });

  test('shows loading state correctly', () => {
    render(<ProjectList projects={[]} loading={true} />);
    
    // Should show skeleton loaders instead of main content
    expect(screen.queryByText('Memory Bank Projects')).not.toBeInTheDocument();
    expect(screen.queryByText('Projects (0)')).not.toBeInTheDocument();
  });

  test('shows empty state when no projects are available', () => {
    render(<ProjectList projects={[]} />);
    
    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText(/No projects are available in your memory bank/)).toBeInTheDocument();
  });

  test('clears search when clear button is clicked', () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No projects match your search')).toBeInTheDocument();
    
    const clearButton = screen.getByText('clear the search');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });

  // New functionality tests
  describe('Date formatting', () => {
    test('displays relative dates for recent projects', () => {
      render(<ProjectList projects={mockProjects} />);
      
      // Should show "today at" for today's project
      expect(screen.getByText(/today at \d+:\d+ (AM|PM)/)).toBeInTheDocument();
      
      // Should show "yesterday at" for yesterday's project
      expect(screen.getByText(/yesterday at \d+:\d+ (AM|PM)/)).toBeInTheDocument();
      
      // Should show day name for projects within the last week - use getAllByText to handle multiple matches
      const relativeTimeElements = screen.getAllByText(/\w+ at \d+:\d+ (AM|PM)/);
      expect(relativeTimeElements.length).toBeGreaterThan(0);
    });

    test('displays standard date format for older projects', () => {
      render(<ProjectList projects={mockProjects} />);
      
      // Two weeks old should use standard format
      const oldProjectElements = screen.getAllByText(/\w+, \d+/);
      expect(oldProjectElements.length).toBeGreaterThan(0);
    });
  });

  describe('Copy functionality', () => {
    test('copies project name to clipboard when copy button is clicked', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      render(<ProjectList projects={mockProjects} />);
      
      const copyButtons = screen.getAllByLabelText(/Copy project name:/);
      fireEvent.click(copyButtons[0]);
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Test Project 1');
      });
    });

    test('shows success icon after successful copy', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      render(<ProjectList projects={mockProjects} />);
      
      const copyButtons = screen.getAllByLabelText(/Copy project name:/);
      fireEvent.click(copyButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      });
    });

    test('falls back to document.execCommand when clipboard API fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard not available'));
      
      // Mock document methods
      const mockTextArea = {
        value: '',
        select: vi.fn(),
      };
      const mockExecCommand = vi.fn().mockReturnValue(true);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue(mockTextArea);
      
      Object.defineProperty(document, 'execCommand', { value: mockExecCommand, writable: true });
      Object.defineProperty(document, 'createElement', { value: mockCreateElement, writable: true });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild, writable: true });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild, writable: true });
      
      render(<ProjectList projects={mockProjects} />);
      
      const copyButtons = screen.getAllByLabelText(/Copy project name:/);
      fireEvent.click(copyButtons[0]);
      
      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });
    });
  });

  describe('Archive functionality', () => {
    test('shows archive confirmation dialog when archive button is clicked', async () => {
      render(<ProjectList projects={mockProjects} />);
      
      const archiveButtons = screen.getAllByLabelText(/Archive project:/);
      fireEvent.click(archiveButtons[0]);
      
      expect(screen.getByText('Archive Project')).toBeInTheDocument();
      expect(screen.getByText("Are you sure you want to archive 'Test Project 1'?")).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Archive Project')).toBeInTheDocument();
    });

    test('closes confirmation dialog when cancel is clicked', async () => {
      render(<ProjectList projects={mockProjects} />);
      
      const archiveButtons = screen.getAllByLabelText(/Archive project:/);
      fireEvent.click(archiveButtons[0]);
      
      expect(screen.getByText('Archive Project')).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Archive Project')).not.toBeInTheDocument();
    });

    test('calls archive API when archive is confirmed', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Archived successfully' }),
      });

      const mockOnProjectArchived = vi.fn();
      render(<ProjectList projects={mockProjects} onProjectArchived={mockOnProjectArchived} />);
      
      const archiveButtons = screen.getAllByLabelText(/Archive project:/);
      fireEvent.click(archiveButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Project' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/projects/Test%20Project%201/archive',
          { method: 'POST' }
        );
      });
      
      await waitFor(() => {
        expect(mockOnProjectArchived).toHaveBeenCalled();
      });
    });

    test('handles archive API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Archive failed' }),
      });

      // Mock alert
      window.alert = vi.fn();
      
      render(<ProjectList projects={mockProjects} />);
      
      const archiveButtons = screen.getAllByLabelText(/Archive project:/);
      fireEvent.click(archiveButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Project' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Archive failed');
      });
    });

    test('shows loading state while archiving', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          }), 100);
        })
      );
      
      render(<ProjectList projects={mockProjects} />);
      
      const archiveButtons = screen.getAllByLabelText(/Archive project:/);
      fireEvent.click(archiveButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Project' });
      fireEvent.click(confirmButton);
      
      expect(screen.getByText('Archiving...')).toBeInTheDocument();
    });
  });
});