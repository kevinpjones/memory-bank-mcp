import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';

// Mock ReactMarkdown and its plugins
vi.mock('react-markdown', () => ({
  default: ({ children, components }: any) => {
    // Simulate the behavior of ReactMarkdown with inline code
    const content = children || '';
    
    // Find inline code patterns like `code here`
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = content.split(inlineCodeRegex);
    
    return (
      <div data-testid="markdown-content">
        {parts.map((part: string, index: number) => {
          // Odd indices are code content (due to how split works with capturing groups)
          if (index % 2 === 1) {
            // Simulate ReactMarkdown calling our code component
            const CodeComponent = components?.code;
            if (CodeComponent) {
              return (
                <CodeComponent
                  key={index}
                  inline={true}
                  className=""
                  children={part}
                />
              );
            }
            return <code key={index}>{part}</code>;
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  }
}));

vi.mock('remark-gfm', () => ({
  default: vi.fn()
}));

vi.mock('rehype-highlight', () => ({
  default: vi.fn()
}));

vi.mock('highlight.js/styles/github-dark.css', () => ({}));

describe('MarkdownRenderer', () => {
  describe('Inline Code Rendering', () => {
    it('should render inline code with proper inline class', () => {
      render(
        <MarkdownRenderer>
          This text has `inline code` in the middle of a sentence.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('inline code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('inline');
    });

    it('should keep inline code actually inline with surrounding text', () => {
      render(
        <MarkdownRenderer>
          Use the `Array.map()` method to transform arrays.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('Array.map()');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('inline');
      
      // Ensure it has inline display properties
      expect(codeElement).toHaveClass('bg-gray-100');
      expect(codeElement).toHaveClass('dark:bg-gray-800');
      expect(codeElement).toHaveClass('px-1.5');
      expect(codeElement).toHaveClass('py-0.5');
      expect(codeElement).toHaveClass('rounded');
      expect(codeElement).toHaveClass('font-mono');
    });

    it('should render multiple inline code elements correctly', () => {
      render(
        <MarkdownRenderer>
          Compare `useState` with `useEffect` hooks.
        </MarkdownRenderer>
      );

      const useState = screen.getByText('useState');
      const useEffect = screen.getByText('useEffect');
      
      expect(useState).toBeInTheDocument();
      expect(useState).toHaveClass('inline');
      
      expect(useEffect).toBeInTheDocument();
      expect(useEffect).toHaveClass('inline');
    });

    it('should handle inline code at the beginning of text', () => {
      render(
        <MarkdownRenderer>
          `console.log()` prints output to the console.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('console.log()');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('inline');
    });

    it('should handle inline code at the end of text', () => {
      render(
        <MarkdownRenderer>
          JavaScript provides the built-in `Array.prototype.filter()`.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('Array.prototype.filter()');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('inline');
    });

    it('should handle back-to-back inline code elements', () => {
      render(
        <MarkdownRenderer>
          Use `const` or `let` for variable declarations.
        </MarkdownRenderer>
      );

      const constElement = screen.getByText('const');
      const letElement = screen.getByText('let');
      
      expect(constElement).toBeInTheDocument();
      expect(constElement).toHaveClass('inline');
      
      expect(letElement).toBeInTheDocument();
      expect(letElement).toHaveClass('inline');
    });
  });

  describe('Styling Classes', () => {
    it('should apply correct light mode classes', () => {
      render(
        <MarkdownRenderer>
          This has `inline code` in it.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('inline code');
      expect(codeElement).toHaveClass('bg-gray-100');
      expect(codeElement).toHaveClass('text-gray-900');
    });

    it('should apply correct dark mode classes', () => {
      render(
        <MarkdownRenderer>
          This has `dark code` in it.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('dark code');
      expect(codeElement).toHaveClass('dark:bg-gray-800');
      expect(codeElement).toHaveClass('dark:text-gray-100');
    });

    it('should use monospace font', () => {
      render(
        <MarkdownRenderer>
          Code like `monospace` should use mono font.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('monospace');
      expect(codeElement).toHaveClass('font-mono');
    });

    it('should have proper spacing classes', () => {
      render(
        <MarkdownRenderer>
          Code with `proper spacing` looks better.
        </MarkdownRenderer>
      );

      const codeElement = screen.getByText('proper spacing');
      expect(codeElement).toHaveClass('px-1.5');
      expect(codeElement).toHaveClass('py-0.5');
      expect(codeElement).toHaveClass('rounded');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className prop', () => {
      render(
        <MarkdownRenderer className="custom-prose-class">
          Some `inline code` here.
        </MarkdownRenderer>
      );

      const container = screen.getByTestId('markdown-content').parentElement;
      expect(container).toHaveClass('custom-prose-class');
    });

    it('should use default className when none provided', () => {
      render(
        <MarkdownRenderer>
          Some `code` content.
        </MarkdownRenderer>
      );

      const container = screen.getByTestId('markdown-content').parentElement;
      expect(container).toHaveClass('prose');
      expect(container).toHaveClass('prose-gray');
      expect(container).toHaveClass('dark:prose-invert');
      expect(container).toHaveClass('max-w-none');
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty content', () => {
      render(<MarkdownRenderer>{''}</MarkdownRenderer>);
      
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('');
    });

    it('should handle content without any code', () => {
      render(
        <MarkdownRenderer>
          This is just plain text without any code elements.
        </MarkdownRenderer>
      );

      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('This is just plain text without any code elements.');
    });

    it('should handle backticks without content', () => {
      render(
        <MarkdownRenderer>
          Empty backticks `` should be handled gracefully.
        </MarkdownRenderer>
      );

      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });
  });
});