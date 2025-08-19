import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PromptEditPage from '../../../../../app/prompts/[name]/edit/page';

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
vi.mock('../../../../../components/Layout', () => ({
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

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CommandLineIcon: () => <div data-testid="command-line-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn();

// Mock window.addEventListener for beforeunload
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('PromptEditPage Component', () => {
  const mockRawContentResponse = {
    success: true,
    data: {
      name: 'test-prompt',
      content: `---
name: test-prompt
title: Test Prompt Template
description: A test prompt for validation
arguments:
  - name: input
    description: The input text
    required: true
  - name: style
    description: The writing style
    required: false
---

Please process this **{{input}}** with style {{style}}.

## Requirements
- Be clear
- Be concise`
    }
  };

  const mockSaveResponse = {
    success: true,
    data: {
      name: 'test-prompt',
      message: 'Prompt saved successfully'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
    (global.confirm as any).mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PromptEditPage />);
      
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
        json: () => Promise.resolve(mockRawContentResponse)
      });
    });

    it('should render editor with loaded content', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Prompt')).toBeInTheDocument();
      });
      
      expect(screen.getByText('test-prompt')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue(mockRawContentResponse.data.content);
      expect(screen.getByText('Prompt Content')).toBeInTheDocument();
    });

    it('should show correct breadcrumbs', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        const breadcrumbs = screen.getByTestId('breadcrumbs');
        expect(breadcrumbs).toHaveTextContent('Prompts');
        expect(breadcrumbs).toHaveTextContent('test-prompt');
        expect(breadcrumbs).toHaveTextContent('Edit');
      });
    });

    it('should have cancel and save buttons', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Changes/ })).toBeInTheDocument();
      });
    });

    it('should initially have save button disabled', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Content Editing', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
    });

    it('should enable save button when content changes', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\n\nAdditional content');
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        expect(saveButton).not.toBeDisabled();
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should show unsaved changes indicator', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should setup beforeunload listener for unsaved changes', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      });
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRawContentResponse)
        });
    });

    it('should save changes successfully', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\n\nNew content');
      
      // Mock save response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSaveResponse)
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Prompt saved successfully!')).toBeInTheDocument();
      });
      
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/prompts/test-prompt/raw',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('New content')
        })
      );
    });

    it('should show saving state', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      // Mock slow save response
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should handle save errors', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      // Mock save error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          message: 'Permission denied'
        })
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error saving prompt: Permission denied/)).toBeInTheDocument();
      });
    });

    it('should reset unsaved changes after successful save', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
      
      // Mock save response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSaveResponse)
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
    });

    it('should navigate back without confirmation when no changes', async () => {
      const user = userEvent.setup();
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/prompts/test-prompt');
      expect(global.confirm).not.toHaveBeenCalled();
    });

    it('should show confirmation when there are unsaved changes', async () => {
      const user = userEvent.setup();
      (global.confirm as any).mockReturnValue(true);
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);
      
      expect(global.confirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
      expect(mockPush).toHaveBeenCalledWith('/prompts/test-prompt');
    });

    it('should not navigate when confirmation is declined', async () => {
      const user = userEvent.setup();
      (global.confirm as any).mockReturnValue(false);
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);
      
      expect(global.confirm).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error state when loading fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          message: 'Prompt not found'
        })
      });
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Prompt')).toBeInTheDocument();
        expect(screen.getByText('Prompt not found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
      });
    });

    it('should handle network errors during load', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle network errors during save', async () => {
      const user = userEvent.setup();
      
      // Successful load
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      // Network error on save
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error saving prompt: Network error/)).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button clicked', async () => {
      const user = userEvent.setup();
      
      // First call fails
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Error' })
      });
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
      });
      
      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
      
      const retryButton = screen.getByRole('button', { name: /Retry/ });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Prompt')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });

  describe('Status Messages', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
    });

    it('should show and hide success message', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes and save
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSaveResponse)
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Prompt saved successfully!')).toBeInTheDocument();
      });
      
      // Fast-forward time to hide message
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('Prompt saved successfully!')).not.toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });

    it('should show and hide error message', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Make changes and trigger save error
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\nModified');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Error' })
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error saving prompt: Error/)).toBeInTheDocument();
      });
      
      // Fast-forward time to hide message
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.queryByText(/Error saving prompt: Error/)).not.toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
    });

    it('should have proper heading hierarchy', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Edit Prompt' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Prompt Content' })).toBeInTheDocument();
      });
    });

    it('should have accessible form controls', async () => {
      render(<PromptEditPage />);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveAttribute('spellCheck', 'false');
        
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        const cancelButton = screen.getByRole('button', { name: /Cancel/ });
        
        expect(saveButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
      });
    });
  });

  describe('URL Encoding', () => {
    it('should handle encoded prompt names in API calls', async () => {
      // Update mock params to have a name that needs encoding
      Object.assign(mockParams, { name: 'test prompt with spaces' });
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawContentResponse)
      });
      
      render(<PromptEditPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/prompts/test%20prompt%20with%20spaces/raw');
      });
    });
  });
});