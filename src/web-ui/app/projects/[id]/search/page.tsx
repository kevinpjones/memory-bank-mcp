'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
import { SearchResponse } from '@/lib/memory-bank';
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function ProjectSearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const projectName = decodeURIComponent(projectId);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [caseSensitive, setCaseSensitive] = useState(searchParams.get('case') === 'true');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, caseSensitiveSearch: boolean) => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const params = new URLSearchParams({
        q: searchQuery,
        case: caseSensitiveSearch.toString(),
      });
      
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/search?${params}`
      );
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Search failed');
      }
      
      setResults(result.data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q, searchParams.get('case') === 'true');
    }
  }, [searchParams, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    params.set('q', query);
    if (caseSensitive) params.set('case', 'true');
    
    router.push(`/projects/${encodeURIComponent(projectId)}/search?${params}`);
    performSearch(query, caseSensitive);
  };

  const highlightMatches = (text: string, searchQuery: string, caseSensitiveSearch: boolean) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      caseSensitiveSearch ? 'g' : 'gi'
    );
    
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = regex.test(part);
      return isMatch ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  const breadcrumbs = [
    { label: 'Projects', href: '/' },
    { label: projectName, href: `/projects/${encodeURIComponent(projectName)}` },
    { label: 'Search', href: `/projects/${encodeURIComponent(projectName)}/search` },
  ];

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Search Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Search in {projectName}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for content within project files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                         transition-colors text-lg"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Case sensitive
                </span>
              </label>
              
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Search Error
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Searching through project files...
              </span>
            </div>
          </div>
        )}

        {results && hasSearched && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{results.searchTime}ms</span>
                  </div>
                  <span>
                    {results.totalMatches} matches in {results.results.length} files
                  </span>
                </div>
              </div>
            </div>

            {results.results.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or removing the case-sensitive option.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.results.map((result, index) => (
                  <div key={`${result.file}-${result.line}-${index}`} className="p-6">
                    <div className="flex items-start space-x-4">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link
                            href={`/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(result.file)}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            {result.file}
                          </Link>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Line {result.line}
                          </span>
                          {result.matches > 1 && (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                              {result.matches} matches
                            </span>
                          )}
                        </div>
                        
                        {/* Context Before */}
                        {result.beforeContext.length > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-1">
                            {result.beforeContext.map((line, i) => (
                              <div key={i} className="truncate">
                                {result.line - result.beforeContext.length + i}: {line}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Matching Line */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 pl-4 py-2 my-2">
                          <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            <span className="text-gray-500 dark:text-gray-400 mr-2">
                              {result.line}:
                            </span>
                            {highlightMatches(result.content, results.query, caseSensitive)}
                          </code>
                        </div>
                        
                        {/* Context After */}
                        {result.afterContext.length > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                            {result.afterContext.map((line, i) => (
                              <div key={i} className="truncate">
                                {result.line + i + 1}: {line}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!hasSearched && !loading && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Search Project Files
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Enter a search term to find content within all files in this project. 
              Search results will show context lines around each match.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}