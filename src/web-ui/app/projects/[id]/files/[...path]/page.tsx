'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
import { FileInfo } from '@/lib/memory-bank';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  DocumentIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import 'highlight.js/styles/github-dark.css';

interface FileViewResponse {
  content: string;
  file: FileInfo;
  project: {
    name: string;
  };
}

export default function FileViewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const filePath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  
  const projectName = decodeURIComponent(projectId);
  const fileName = decodeURIComponent(filePath);
  
  const [data, setData] = useState<FileViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchFileContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(filePath)}`
      );
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch file content');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId, filePath]);

  useEffect(() => {
    fetchFileContent();
  }, [fetchFileContent]);

  const handleCopyContent = async () => {
    if (!data?.content) return;
    
    try {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const breadcrumbs = [
    { label: 'Projects', href: '/' },
    { label: projectName, href: `/projects/${encodeURIComponent(projectName)}` },
    { label: fileName, href: `/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}` },
  ];

  if (loading) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>

          {/* Content skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
              Error Loading File
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={fetchFileContent}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* File Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {data.file.isMarkdown ? (
                <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              ) : (
                <DocumentIcon className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-1" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {data.file.name}
                </h1>
                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(data.file.size)}</span>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Modified {formatDate(data.file.lastModified)}</span>
                  </div>
                  <span>
                    {data.file.isMarkdown ? 'Markdown' : 'Text'} file
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCopyContent}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* File Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Content
            </h2>
          </div>
          
          <div className="p-6">
            {data.file.isMarkdown ? (
              <div className="prose prose-lg prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-2" {...props}>
                        {children}
                      </h3>
                    ),
                    h4: ({ children, ...props }) => (
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2" {...props}>
                        {children}
                      </h4>
                    ),
                    h5: ({ children, ...props }) => (
                      <h5 className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2" {...props}>
                        {children}
                      </h5>
                    ),
                    h6: ({ children, ...props }) => (
                      <h6 className="text-sm font-semibold text-gray-900 dark:text-white mt-4 mb-2" {...props}>
                        {children}
                      </h6>
                    ),
                    p: ({ children, ...props }) => (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
                        {children}
                      </p>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700 dark:text-gray-300" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700 dark:text-gray-300" {...props}>
                        {children}
                      </ol>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="mb-1" {...props}>
                        {children}
                      </li>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic" {...props}>
                        {children}
                      </blockquote>
                    ),
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
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {data.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono overflow-x-auto">
                  {data.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}