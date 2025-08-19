'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
import { 
  CommandLineIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function PromptEditPage() {
  const params = useParams();
  const router = useRouter();
  const promptName = params.name as string;
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!promptName) return;
    fetchPromptRawContent();
  }, [promptName]);

  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent);
  }, [content, originalContent]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchPromptRawContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/prompts/${encodeURIComponent(promptName)}/raw`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch prompt content');
      }
      
      setContent(data.data.content);
      setOriginalContent(data.data.content);
    } catch (err) {
      console.error('Error fetching prompt content:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/prompts/${encodeURIComponent(promptName)}/raw`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save prompt');
      }
      
      setOriginalContent(content);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/prompts/${encodeURIComponent(promptName)}`);
      }
    } else {
      router.push(`/prompts/${encodeURIComponent(promptName)}`);
    }
  };

  const breadcrumbs = [
    { label: 'Prompts', href: '/prompts' },
    { label: promptName, href: `/prompts/${encodeURIComponent(promptName)}` },
    { label: 'Edit', href: '' }
  ];

  if (loading) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !content) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
              Error Loading Prompt
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={fetchPromptRawContent}
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
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CommandLineIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Prompt
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {promptName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>Unsaved changes</span>
                </span>
              )}
              
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
              
              <button
                onClick={savePrompt}
                disabled={saving || !hasUnsavedChanges}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saving || !hasUnsavedChanges
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-400 font-medium">
                Prompt saved successfully!
              </span>
            </div>
          </div>
        )}
        
        {saveStatus === 'error' && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-400 font-medium">
                Error saving prompt: {error}
              </span>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prompt Content
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Markdown with YAML frontmatter
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg 
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                         resize-y transition-colors"
                placeholder="---
name: example-prompt
title: Example Prompt
description: A sample prompt template
arguments:
  - name: input
    description: The input text
    required: true
---

Your prompt content here with {{input}} parameter substitution."
                spellCheck={false}
              />
            </div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">YAML Frontmatter Structure:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li><code>name</code>: Unique identifier</li>
                    <li><code>title</code>: Display name (optional)</li>
                    <li><code>description</code>: Brief explanation (optional)</li>
                    <li><code>arguments</code>: Array of parameter definitions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Argument Properties:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li><code>name</code>: Parameter name</li>
                    <li><code>description</code>: Parameter explanation</li>
                    <li><code>required</code>: Boolean (true/false)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}