import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';

// Mock ReactMarkdown and its plugins
vi.mock('react-markdown', () => ({
  default: ({ children, components }: any) => {
    const content = children || '';
    
    // Handle lists - look for numbered and bulleted lists
    const listRegex = /^(\d+\.|\•)\s*(.+)$/gm;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    // Check if content contains lists
    if (listRegex.test(content)) {
      const lines = content.split('\n');
      const elements: any[] = [];
      let currentList: any[] = [];
      let listType: 'ol' | 'ul' | null = null;
      
      lines.forEach((line: string, index: number) => {
        const trimmedLine = line.trim();
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
        const bulletMatch = trimmedLine.match(/^•\s*(.+)$/);
        
        if (numberedMatch) {
          if (listType !== 'ol') {
            if (currentList.length > 0 && components) {
              const ListComponent = listType === 'ul' ? components.ul : components.ol;
              elements.push(
                <ListComponent key={elements.length}>
                  {currentList.map((item, i) => {
                    const LiComponent = components.li;
                    return LiComponent ? <LiComponent key={i}>{item}</LiComponent> : <li key={i}>{item}</li>;
                  })}
                </ListComponent>
              );
            }
            currentList = [];
            listType = 'ol';
          }
          currentList.push(numberedMatch[2]);
        } else if (bulletMatch) {
          if (listType !== 'ul') {
            if (currentList.length > 0 && components) {
              const ListComponent = listType === 'ol' ? components.ol : components.ul;
              elements.push(
                <ListComponent key={elements.length}>
                  {currentList.map((item, i) => {
                    const LiComponent = components.li;
                    return LiComponent ? <LiComponent key={i}>{item}</LiComponent> : <li key={i}>{item}</li>;
                  })}
                </ListComponent>
              );
            }
            currentList = [];
            listType = 'ul';
          }
          currentList.push(bulletMatch[1]);
        } else if (trimmedLine && currentList.length > 0) {
          // Handle list item content that continues on the next line
          if (currentList.length > 0) {
            currentList[currentList.length - 1] += ` ${trimmedLine}`;
          }
        }
      });
      
      // Add the final list if there is one
      if (currentList.length > 0 && components && listType) {
        const ListComponent = components[listType];
        elements.push(
          <ListComponent key={elements.length}>
            {currentList.map((item, i) => {
              const LiComponent = components.li;
              return LiComponent ? <LiComponent key={i}>{item}</LiComponent> : <li key={i}>{item}</li>;
            })}
          </ListComponent>
        );
      }
      
      return <div data-testid="markdown-content">{elements}</div>;
    }
    
    // Handle inline code as before
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

  describe('List Rendering', () => {
    describe('Ordered Lists', () => {
      it('should render numbered lists with correct CSS classes', () => {
        render(
          <MarkdownRenderer>
            {`1. First item
2. Second item
3. Third item`}
          </MarkdownRenderer>
        );

        const orderedList = screen.getByRole('list');
        expect(orderedList).toBeInTheDocument();
        expect(orderedList.tagName).toBe('OL');
        expect(orderedList).toHaveClass('list-decimal');
        expect(orderedList).toHaveClass('list-outside');
        expect(orderedList).toHaveClass('ml-6');
        expect(orderedList).toHaveClass('space-y-1');
        expect(orderedList).toHaveClass('my-4');
      });

      it('should render numbered list items with proper content', () => {
        render(
          <MarkdownRenderer>
            {`1. Context Intake
2. Automated Pass (quick)
3. Deep Analysis`}
          </MarkdownRenderer>
        );

        expect(screen.getByText('Context Intake')).toBeInTheDocument();
        expect(screen.getByText('Automated Pass (quick)')).toBeInTheDocument();
        expect(screen.getByText('Deep Analysis')).toBeInTheDocument();
      });

      it('should handle multi-line list items correctly', () => {
        render(
          <MarkdownRenderer>
            {`1. **Context Intake**
   Review the change description and understand the goal
2. **Automated Pass**
   Look for obvious issues`}
          </MarkdownRenderer>
        );

        expect(screen.getByText(/Context Intake.*Review the change description/)).toBeInTheDocument();
        expect(screen.getByText(/Automated Pass.*Look for obvious issues/)).toBeInTheDocument();
      });
    });

    describe('Unordered Lists', () => {
      it('should render bulleted lists with correct CSS classes', () => {
        render(
          <MarkdownRenderer>
            {`• First bullet
• Second bullet
• Third bullet`}
          </MarkdownRenderer>
        );

        const unorderedList = screen.getByRole('list');
        expect(unorderedList).toBeInTheDocument();
        expect(unorderedList.tagName).toBe('UL');
        expect(unorderedList).toHaveClass('list-disc');
        expect(unorderedList).toHaveClass('list-outside');
        expect(unorderedList).toHaveClass('ml-6');
        expect(unorderedList).toHaveClass('space-y-1');
        expect(unorderedList).toHaveClass('my-4');
      });

      it('should render bulleted list items with proper content', () => {
        render(
          <MarkdownRenderer>
            {`• Review the change description and understand the goal
• Identify the change scope (diff, commit list, or directory)
• Read surrounding code to understand intent and style`}
          </MarkdownRenderer>
        );

        expect(screen.getByText('Review the change description and understand the goal')).toBeInTheDocument();
        expect(screen.getByText('Identify the change scope (diff, commit list, or directory)')).toBeInTheDocument();
        expect(screen.getByText('Read surrounding code to understand intent and style')).toBeInTheDocument();
      });

      it('should handle multi-line bulleted list items', () => {
        render(
          <MarkdownRenderer>
            {`• Line-by-line inspection
  Check security, performance, error handling
• Note violations of SOLID, DRY, KISS
  Follow least-privilege principles`}
          </MarkdownRenderer>
        );

        expect(screen.getByText(/Line-by-line inspection.*Check security, performance/)).toBeInTheDocument();
        expect(screen.getByText(/Note violations of SOLID.*Follow least-privilege/)).toBeInTheDocument();
      });
    });

    describe('List Items', () => {
      it('should render list items with correct CSS classes', () => {
        render(
          <MarkdownRenderer>
            {`1. First item
2. Second item`}
          </MarkdownRenderer>
        );

        const listItems = screen.getAllByRole('listitem');
        listItems.forEach(item => {
          expect(item).toHaveClass('mb-1');
          expect(item).toHaveClass('pl-1');
        });
      });

      it('should handle complex list item content', () => {
        render(
          <MarkdownRenderer>
            {`1. **Context Intake**
   
   • Review the change description and understand the goal of the change
   • Identify the change scope (diff, commit list, or directory)
   • Read surrounding code to understand intent and style
   • Gather test status and coverage reports if present`}
          </MarkdownRenderer>
        );

        // The mock treats ** as literal text, so we check for the exact text
        expect(screen.getByText('**Context Intake**')).toBeInTheDocument();
        expect(screen.getByText('Review the change description and understand the goal of the change')).toBeInTheDocument();
        expect(screen.getByText('Gather test status and coverage reports if present')).toBeInTheDocument();
      });
    });

    describe('Severity Lists', () => {
      it('should handle severity delegation list format', () => {
        render(
          <MarkdownRenderer>
            {`• 🔴 **Critical** – must fix now
• 🟡 **Major** – should fix soon  
• 🟢 **Minor** – style / docs`}
          </MarkdownRenderer>
        );

        expect(screen.getByText('🔴 **Critical** – must fix now')).toBeInTheDocument();
        expect(screen.getByText('🟡 **Major** – should fix soon')).toBeInTheDocument();
        expect(screen.getByText('🟢 **Minor** – style / docs')).toBeInTheDocument();
      });
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