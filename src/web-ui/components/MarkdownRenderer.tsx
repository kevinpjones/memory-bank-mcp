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
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-outside ml-6 space-y-1 my-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-outside ml-6 space-y-1 my-4" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="mb-1 pl-1" {...props}>
              {children}
            </li>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}