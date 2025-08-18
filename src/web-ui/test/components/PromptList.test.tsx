import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PromptList from '../../components/PromptList';
import { PromptInfo } from '../../lib/memory-bank';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon" />,
  CommandLineIcon: () => <div data-testid="command-line-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  CheckBadgeIcon: () => <div data-testid="check-badge-icon" />,
  ExclamationCircleIcon: () => <div data-testid="exclamation-circle-icon" />
}));

describe('PromptList Component', () => {
  const mockPrompts: PromptInfo[] = [
    {
      name: 'code-review',
      title: 'Code Review Assistant',
      description: 'Analyzes code for quality, best practices, and potential improvements',
      arguments: [
        { name: 'code', description: 'The code to review', required: true },
        { name: 'language', description: 'Programming language', required: false },
        { name: 'focus', description: 'Specific aspect to focus on', required: false }
      ],
      template: 'Please review this {{language}} code: {{code}}',
      lastModified: new Date('2023-12-01T10:30:00Z'),
      size: 1024
    },
    {
      name: 'doc-generator',
      title: 'Documentation Generator',
      description: 'Generates comprehensive documentation for code or features',
      arguments: [
        { name: 'content', description: 'Content to document', required: true }
      ],
      template: 'Generate documentation for: {{content}}',
      lastModified: new Date('2023-11-15T09:15:00Z'),
      size: 512
    },
    {
      name: 'test-prompt',
      title: 'Test Prompt',
      description: 'A simple test prompt',
      arguments: [],
      template: 'This is a test template',
      lastModified: undefined, // Test undefined date handling
      size: undefined
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      render(<PromptList prompts={[]} loading={true} />);
      
      expect(screen.getByText('Loading Prompts...')).toBeInTheDocument();
      
      // Should show skeleton cards
      const skeletonCards = screen.getAllByTestId(/animate-pulse/);
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should not render loading skeleton when loading is false', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      expect(screen.queryByText('Loading Prompts...')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no prompts and not searching', () => {
      render(<PromptList prompts={[]} loading={false} />);
      
      expect(screen.getByText('No prompts found')).toBeInTheDocument();
      expect(screen.getByText(/No prompt templates are available/)).toBeInTheDocument();
      expect(screen.getByText(/create markdown files in the .prompts directory/)).toBeInTheDocument();
    });

    it('should render search empty state when searching with no results', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No matching prompts')).toBeInTheDocument();
        expect(screen.getByText(/No prompts match your search term/)).toBeInTheDocument();
      });
    });
  });

  describe('Prompts Display', () => {
    it('should render all prompts when not filtering', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
      expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
      
      // Check prompt count
      expect(screen.getByText('Prompts (3)')).toBeInTheDocument();
    });

    it('should render prompt metadata correctly', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // Check descriptions
      expect(screen.getByText(/Analyzes code for quality/)).toBeInTheDocument();
      expect(screen.getByText(/Generates comprehensive documentation/)).toBeInTheDocument();
      
      // Check parameter counts
      expect(screen.getByText('Parameters (3)')).toBeInTheDocument();
      expect(screen.getByText('Parameters (1)')).toBeInTheDocument();
      expect(screen.getByText('Parameters (0)')).toBeInTheDocument();
    });

    it('should display parameter badges correctly', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // Should show required and optional parameter badges
      expect(screen.getByText('code')).toBeInTheDocument();
      expect(screen.getByText('language')).toBeInTheDocument();
      expect(screen.getByText('focus')).toBeInTheDocument();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('should handle dates gracefully', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // Should show formatted dates for valid dates
      expect(screen.getByText(/Dec \d+, 2023/)).toBeInTheDocument();
      expect(screen.getByText(/Nov \d+, 2023/)).toBeInTheDocument();
      
      // Should show "Unknown" for undefined dates
      expect(screen.getAllByText('Unknown')).toHaveLength(2); // Date and size for test-prompt
    });

    it('should format file sizes correctly', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
      expect(screen.getByText('512 B')).toBeInTheDocument();
      expect(screen.getAllByText('Unknown')).toContain(
        expect.objectContaining({ textContent: 'Unknown' })
      );
    });

    it('should create correct links to individual prompts', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const codeReviewLink = screen.getByRole('link', { name: /Code Review Assistant/ });
      expect(codeReviewLink).toHaveAttribute('href', '/prompts/code-review');
      
      const docGenLink = screen.getByRole('link', { name: /Documentation Generator/ });
      expect(docGenLink).toHaveAttribute('href', '/prompts/doc-generator');
    });
  });

  describe('Search Functionality', () => {
    it('should filter prompts by name', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'code-review');
      
      await waitFor(() => {
        expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Prompt')).not.toBeInTheDocument();
        
        // Should show filtered count
        expect(screen.getByText('1 of 3 prompts shown')).toBeInTheDocument();
      });
    });

    it('should filter prompts by title', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'Documentation');
      
      await waitFor(() => {
        expect(screen.queryByText('Code Review Assistant')).not.toBeInTheDocument();
        expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
        expect(screen.queryByText('Test Prompt')).not.toBeInTheDocument();
      });
    });

    it('should filter prompts by description', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'quality');
      
      await waitFor(() => {
        expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
      });
    });

    it('should filter prompts by parameter names', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'language');
      
      await waitFor(() => {
        expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      await user.type(searchInput, 'CODE');
      
      await waitFor(() => {
        expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
      });
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/Search prompts/);
      
      // Search for something
      await user.type(searchInput, 'code');
      await waitFor(() => {
        expect(screen.getByText('1 of 3 prompts shown')).toBeInTheDocument();
      });
      
      // Clear search
      await user.clear(searchInput);
      await waitFor(() => {
        expect(screen.getByText('Prompts (3)')).toBeInTheDocument();
        expect(screen.queryByText('of 3 prompts shown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Parameter Display', () => {
    it('should limit parameter display to 3 plus overflow indicator', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // code-review has 3 parameters, should show all 3
      const codeReviewCard = screen.getByRole('link', { name: /Code Review Assistant/ });
      expect(codeReviewCard).toBeInTheDocument();
      
      // Should not show +X more for exactly 3 parameters
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('should show overflow indicator for more than 3 parameters', () => {
      const promptWithManyParams: PromptInfo = {
        name: 'complex-prompt',
        title: 'Complex Prompt',
        description: 'A prompt with many parameters',
        arguments: [
          { name: 'param1', required: true },
          { name: 'param2', required: false },
          { name: 'param3', required: true },
          { name: 'param4', required: false },
          { name: 'param5', required: true }
        ],
        template: 'Complex template',
        size: 1024
      };

      render(<PromptList prompts={[promptWithManyParams]} loading={false} />);
      
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should distinguish between required and optional parameters', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // Required parameters should have exclamation icon, optional should have check icon
      expect(screen.getAllByTestId('exclamation-circle-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('check-badge-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Prompt Templates' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Prompts \(\d+\)/ })).toBeInTheDocument();
    });

    it('should have searchable input with proper label', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search prompts'));
    });

    it('should have proper link structure', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date objects gracefully', () => {
      const promptsWithInvalidDates: PromptInfo[] = [
        {
          name: 'invalid-date-prompt',
          title: 'Invalid Date Prompt',
          description: 'Test prompt with invalid date',
          arguments: [],
          template: 'Test',
          lastModified: new Date('invalid-date'),
          size: 1024
        }
      ];

      // Should not throw error
      expect(() => {
        render(<PromptList prompts={promptsWithInvalidDates} loading={false} />);
      }).not.toThrow();
      
      // Should show "Unknown" for invalid date
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should handle missing prompt metadata gracefully', () => {
      const promptsWithMissingData: PromptInfo[] = [
        {
          name: 'minimal-prompt',
          template: 'Minimal template'
          // Missing title, description, arguments, etc.
        } as PromptInfo
      ];

      // Should not throw error
      expect(() => {
        render(<PromptList prompts={promptsWithMissingData} loading={false} />);
      }).not.toThrow();
      
      expect(screen.getByText('minimal-prompt')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate all sub-components correctly', () => {
      render(<PromptList prompts={mockPrompts} loading={false} />);
      
      // Header section
      expect(screen.getByText('Prompt Templates')).toBeInTheDocument();
      
      // Search section  
      expect(screen.getByPlaceholderText(/Search prompts/)).toBeInTheDocument();
      
      // Stats section
      expect(screen.getByText('Prompts (3)')).toBeInTheDocument();
      
      // Cards section
      expect(screen.getAllByRole('link')).toHaveLength(3);
      
      // Icons should be rendered
      expect(screen.getAllByTestId('command-line-icon')).toHaveLength(3);
      expect(screen.getAllByTestId('document-text-icon')).toHaveLength(3);
      expect(screen.getAllByTestId('calendar-icon')).toHaveLength(3);
    });
  });
});