'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PromptInfo } from '@/lib/memory-bank';
import { 
  MagnifyingGlassIcon, 
  CommandLineIcon,
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface PromptListProps {
  prompts: PromptInfo[];
  loading: boolean;
}

export default function PromptList({ prompts, loading }: PromptListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter prompts based on search term
  const filteredPrompts = useMemo(() => {
    if (!searchTerm.trim()) return prompts;
    
    const term = searchTerm.toLowerCase();
    return prompts.filter(
      prompt =>
        prompt.name.toLowerCase().includes(term) ||
        prompt.title?.toLowerCase().includes(term) ||
        prompt.description?.toLowerCase().includes(term) ||
        prompt.arguments?.some(arg => 
          arg.name.toLowerCase().includes(term) || 
          arg.description?.toLowerCase().includes(term)
        )
    );
  }, [prompts, searchTerm]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Loading Prompts...
          </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Prompt Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Browse and manage your reusable prompt templates. Each prompt contains structured 
          metadata and can be customized with parameters for different use cases.
        </p>
      </div>

      {/* Search and Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prompts ({prompts.length})
          </h2>
          {searchTerm && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPrompts.length} of {prompts.length} prompts shown
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts by name, title, description, or parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                     transition-colors"
          />
        </div>
      </div>

      {/* No Prompts */}
      {filteredPrompts.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <CommandLineIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No prompts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No prompt templates are available in the .prompts directory.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>To add prompts, create markdown files in the .prompts directory with YAML frontmatter.</p>
          </div>
        </div>
      )}

      {/* No Search Results */}
      {filteredPrompts.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No matching prompts
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No prompts match your search term: <strong>"{searchTerm}"</strong>
          </p>
        </div>
      )}

      {/* Prompts Grid */}
      {filteredPrompts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <Link
              key={prompt.name}
              href={`/prompts/${encodeURIComponent(prompt.name)}`}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 
                       hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <CommandLineIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {prompt.title || prompt.name}
                    </h3>
                  </div>
                  {prompt.title && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {prompt.name}
                    </p>
                  )}
                </div>
              </div>

              {prompt.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {prompt.description}
                </p>
              )}

              {/* Parameters */}
              {prompt.arguments && prompt.arguments.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-1 mb-2">
                    <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parameters ({prompt.arguments.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {prompt.arguments.slice(0, 3).map((arg) => (
                      <span
                        key={arg.name}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          arg.required
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {arg.required && <ExclamationCircleIcon className="w-3 h-3" />}
                        {!arg.required && <CheckBadgeIcon className="w-3 h-3" />}
                        <span>{arg.name}</span>
                      </span>
                    ))}
                    {prompt.arguments.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        +{prompt.arguments.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{formatSize(prompt.size)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(prompt.lastModified)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}