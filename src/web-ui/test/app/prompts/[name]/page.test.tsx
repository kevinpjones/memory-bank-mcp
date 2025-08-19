import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PromptViewPage from '../../../../app/prompts/[name]/page';

// Mock Next.js hooks and components
const mockPush = vi.fn();
const mockParams = { name: 'test-prompt' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush
  })
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock('next/dynamic', () => ({
  default: (importFunc: any, options: any) => {
    const Component = importFunc();
    return Component.default || Component;
  }
}));

// Mock Layout component
vi.mock('../../../../components/Layout', () => ({
  default: ({ children, breadcrumbs }: any) => (
    <div data-testid="layout">
      {breadcrumbs && (
        <nav data-testid="breadcrumbs">
          {breadcrumbs.map((crumb: any, i: number) => (
            <span key={i}>{crumb.label}</span>
          ))}
        </nav>
      )}
      {children}
    </div>
  )
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>
}));

// Mock remark-gfm
vi.mock('remark-gfm', () => ({
  default: vi.fn()
}));

// Mock rehype-highlight
vi.mock('rehype-highlight', () => ({
  default: vi.fn()
}));

// Mock CSS import
vi.mock('highlight.js/styles/github-dark.css', () => ({}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CommandLineIcon: () => <div data-testid="command-line-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  CheckBadgeIcon: () => <div data-testid="check-badge-icon" />,
  ExclamationCircleIcon: () => <div data-testid="exclamation-circle-icon" />,
  ClipboardDocumentIcon: () => <div data-testid="clipboard-document-icon" />
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve())
  }
});

// Mock fetch
global.fetch = vi.fn();

describe('PromptViewPage Component', () => {
  const mockPromptResponse = {
    success: true,
    data: {
      name: 'test-prompt',
      title: 'Test Prompt Template',
      description: 'A comprehensive test prompt for validation',
      arguments: [
        { name: 'input', description: 'The input text', required: true },
        { name: 'style', description: 'The writing style', required: false },
        { name: 'format', description: 'Output format', required: true }
      ],
      template: 'Please process this **{{input}}** with style {{style}} in {{format}} format.\n\n## Requirements\n- Be clear\n- Be concise',
      lastModified: new Date('2023-12-01T10:30:00Z'),
      size: 2048
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PromptViewPage />);
      
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      
      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic');
      const loadingElements = skeletons.filter(el => 
        el.classList.contains('animate-pulse')
      );
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPromptResponse)
      });
    });

    it('should render prompt details correctly', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt Template')).toBeInTheDocument();
      });
      
      expect(screen.getByText('test-prompt')).toBeInTheDocument();
      expect(screen.getByText('A comprehensive test prompt for validation')).toBeInTheDocument();
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
      expect(screen.getByText(/Last modified Dec/)).toBeInTheDocument();
    });

    it('should render parameters section correctly', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Parameters (3)')).toBeInTheDocument();
      });
      
      expect(screen.getByText('input')).toBeInTheDocument();
      expect(screen.getByText('The input text')).toBeInTheDocument();
      expect(screen.getByText('style')).toBeInTheDocument();
      expect(screen.getByText('The writing style')).toBeInTheDocument();
      
      // Check required/optional badges
      expect(screen.getAllByText('Required')).toHaveLength(2);
      expect(screen.getAllByText('Optional')).toHaveLength(1);
    });

    it('should render markdown template correctly', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Template')).toBeInTheDocument();
      });
      
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent(/Please process this/);
    });

    it('should show correct breadcrumbs', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        const breadcrumbs = screen.getByTestId('breadcrumbs');
        expect(breadcrumbs).toHaveTextContent('Prompts');
        expect(breadcrumbs).toHaveTextContent('Test Prompt Template');
      });
    });

    it('should have copy and edit buttons', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy Template/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Edit/ })).toBeInTheDocument();
      });
    });

    it('should create correct edit link', async () => {
      render(<PromptViewPage />);
      
      await waitFor(() => {
        const editLink = screen.getByRole('link', { name: /Edit/ });
        expect(editLink).toHaveAttribute('href', '/prompts/test-prompt/edit');
      });
    });
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPromptResponse)
      });
    });

    it('should copy template to clipboard', async () => {
      const user = userEvent.setup();
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy Template/ })).toBeInTheDocument();
      });
      
      const copyButton = screen.getByRole('button', { name: /Copy Template/ });
      await user.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPromptResponse.data.template);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should handle clipboard API failures gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock clipboard failure
      (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard failed'));
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy Template/ })).toBeInTheDocument();
      });
      
      const copyButton = screen.getByRole('button', { name: /Copy Template/ });
      await user.click(copyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should reset copy state after timeout', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy Template/ })).toBeInTheDocument();
      });
      
      const copyButton = screen.getByRole('button', { name: /Copy Template/ });
      await user.click(copyButton);
      
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      
      // Fast-forward time
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByText('Copy Template')).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should show error state when fetch fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          message: 'Prompt not found'
        })
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Prompt')).toBeInTheDocument();
        expect(screen.getByText('Prompt not found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
      });
    });

    it('should show error state when network request fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Prompt')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button clicked', async () => {
      const user = userEvent.setup();
      
      // First call fails
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Error' })
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
      });
      
      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPromptResponse)
      });
      
      const retryButton = screen.getByRole('button', { name: /Retry/ });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt Template')).toBeInTheDocument();
      });
    });
  });

  describe('Date and Size Formatting', () => {
    it('should handle undefined dates gracefully', async () => {
      const responseWithUndefinedDate = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          lastModified: undefined
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithUndefinedDate)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Last modified Unknown')).toBeInTheDocument();
      });
    });

    it('should handle invalid dates gracefully', async () => {
      const responseWithInvalidDate = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          lastModified: new Date('invalid-date')
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithInvalidDate)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Last modified Unknown')).toBeInTheDocument();
      });
    });

    it('should handle undefined sizes gracefully', async () => {
      const responseWithUndefinedSize = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          size: undefined
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithUndefinedSize)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle prompt without parameters', async () => {
      const responseWithoutParams = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          arguments: []
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutParams)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt Template')).toBeInTheDocument();
      });
      
      // Parameters section should not be shown
      expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
    });

    it('should handle prompt with only title (no name shown separately)', async () => {
      const responseWithTitleOnly = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          title: undefined
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithTitleOnly)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('test-prompt')).toBeInTheDocument();
      });
      
      // Should only show the name, not a separate subtitle
      const headings = screen.getAllByRole('heading');
      const mainHeading = headings.find(h => h.textContent === 'test-prompt');
      expect(mainHeading).toBeInTheDocument();
    });

    it('should handle empty template gracefully', async () => {
      const responseWithEmptyTemplate = {
        ...mockPromptResponse,
        data: {
          ...mockPromptResponse.data,
          template: ''
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithEmptyTemplate)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Template')).toBeInTheDocument();
      });
      
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent('');
    });
  });

  describe('API Integration', () => {
    it('should make correct API call with encoded prompt name', async () => {
      // Update mock params to have a name that needs encoding
      Object.assign(mockParams, { name: 'test prompt with spaces' });
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPromptResponse)
      });
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/prompts/test%20prompt%20with%20spaces');
      });
    });

    it('should handle network timeout gracefully', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      render(<PromptViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});