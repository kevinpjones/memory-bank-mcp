'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
import { PromptInfo, PromptArgument } from '@/lib/memory-bank';
import { 
  CommandLineIcon,
  PencilIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function PromptViewPage() {
  const params = useParams();
  const promptName = params.name as string;
  const [prompt, setPrompt] = useState<PromptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!promptName) return;
    fetchPrompt();
  }, [promptName]);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/prompts/${encodeURIComponent(promptName)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch prompt');
      }
      
      setPrompt(data.data);
    } catch (err) {
      console.error('Error fetching prompt:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch {
      return 'Unknown';
    }
  };

  const formatSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const breadcrumbs = [
    { label: 'Prompts', href: '/prompts' },
    { label: prompt?.title || promptName, href: '' }
  ];

  if (loading) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !prompt) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
              Error Loading Prompt
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mb-4">
              {error || 'Prompt not found'}
            </p>
            <button
              onClick={fetchPrompt}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Prompt Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <CommandLineIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {prompt.title || prompt.name}
                  </h1>
                  {prompt.title && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {prompt.name}
                    </p>
                  )}
                </div>
              </div>
              
              {prompt.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
                  {prompt.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{formatSize(prompt.size)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Last modified {formatDate(prompt.lastModified)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => copyToClipboard(prompt.template)}
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
              <Link
                href={`/prompts/${encodeURIComponent(promptName)}/edit`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Parameters */}
        {prompt.arguments && prompt.arguments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TagIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Parameters ({prompt.arguments.length})
              </h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prompt.arguments.map((arg: PromptArgument) => (
                <div
                  key={arg.name}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {arg.required ? (
                      <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {arg.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      arg.required 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    }`}>
                      {arg.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {arg.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {arg.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Template
            </h2>
          </div>
          <div className="p-6">
            <MarkdownRenderer>
              {prompt.template}
            </MarkdownRenderer>
          </div>
        </div>
      </div>
    </Layout>
  );
}