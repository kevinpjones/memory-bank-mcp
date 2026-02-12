'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export default function MarkdownRenderer({ children, className = 'prose prose-gray dark:prose-invert max-w-none' }: MarkdownRendererProps) {
  // Preprocess the markdown to handle bullet characters and improve nesting
  const preprocessMarkdown = (markdown: string): string => {
    const processed = markdown
      // Convert • bullets to standard - bullets, ensuring 4+ space indentation for nesting
      .replace(/^(\s+)• /gm, (match, indent) => {
        // If indented (likely nested), ensure at least 4 spaces
        return indent.length >= 4 ? `${indent}- ` : '    - ';
      })
      // Handle • at beginning of line (not indented)
      .replace(/^• /gm, '- ')
      // Convert other bullet characters
      .replace(/^(\s*)◦ /gm, '$1- ')
      .replace(/^(\s*)▪ /gm, '$1- ')
      // Fix any 3-space indentations to 4-space
      .replace(/^   -/gm, '    -')
      .replace(/^   \*/gm, '    *')
      .replace(/^   \+/gm, '    +');
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development' && markdown.includes('•')) {
      console.log('Original markdown:', markdown);
      console.log('Processed markdown:', processed);
    }
    
    return processed;
  };

  const processedMarkdown = preprocessMarkdown(children);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: ({ inline, className, children, ...props }: any) => {
            // More robust inline detection
            const isInline = inline !== false && !className?.includes('language-');
            
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono inline" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic" {...props}>
              {children}
            </blockquote>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          ul: ({ children, node, ...props }: any) => {
            // Check if this ul is nested inside another list item
            const isNested = node?.parent?.tagName === 'li';
            const baseClasses = "list-disc list-outside space-y-1";
            const spacingClasses = isNested ? "ml-4 my-1" : "ml-6 my-4";
            
            return (
              <ul className={`${baseClasses} ${spacingClasses}`} {...props}>
                {children}
              </ul>
            );
          },
          ol: ({ children, node, ...props }: any) => {
            // Check if this ol is nested inside another list item
            const isNested = node?.parent?.tagName === 'li';
            const baseClasses = "list-decimal list-outside space-y-1";
            const spacingClasses = isNested ? "ml-4 my-1" : "ml-6 my-4";
            
            return (
              <ol className={`${baseClasses} ${spacingClasses}`} {...props}>
                {children}
              </ol>
            );
          },
          li: ({ children, node, ...props }: any) => {
            // Check if this li contains nested lists
            const hasNestedList = node?.children?.some((child: any) => 
              child.tagName === 'ul' || child.tagName === 'ol'
            );
            
            return (
              <li className={`mb-1 pl-1 ${hasNestedList ? 'space-y-1' : ''}`} {...props}>
                {children}
              </li>
            );
          },
        }}
      >
        {processedMarkdown}
      </ReactMarkdown>
    </div>
  );
}