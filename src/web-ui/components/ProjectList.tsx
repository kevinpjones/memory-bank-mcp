'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon, ClipboardIcon, CheckIcon, ArchiveBoxIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ProjectInfo } from '@/lib/memory-bank';

interface ProjectListProps {
  projects: ProjectInfo[];
  loading?: boolean;
  onProjectArchived?: () => void; // Callback to refresh projects list
}

export default function ProjectList({ projects, loading, onProjectArchived }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedProject, setCopiedProject] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    
    const term = searchTerm.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const inputDate = new Date(date);
    const diffInMs = now.getTime() - inputDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // For dates within the last 7 days, show relative timestamps
    if (diffInDays <= 7) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = inputDate.toDateString() === today.toDateString();
      const isYesterday = inputDate.toDateString() === yesterday.toDateString();
      
      const timeFormat = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(inputDate);
      
      if (isToday) {
        return `today at ${timeFormat}`;
      } else if (isYesterday) {
        return `yesterday at ${timeFormat}`;
      } else if (diffInDays <= 6) {
        const dayName = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
        }).format(inputDate);
        return `${dayName} at ${timeFormat}`;
      }
    }
    
    // For older dates, use the original format
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(inputDate);
  };

  const handleCopyTitle = async (projectName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(projectName);
      setCopiedProject(projectName);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedProject(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy project name:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = projectName;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedProject(projectName);
        setTimeout(() => {
          setCopiedProject(null);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleArchiveProject = async (projectName: string) => {
    try {
      setArchiving(projectName);
      
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/archive`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to archive project');
      }
      
      // Close confirmation dialog
      setArchiveConfirm(null);
      
      // Call callback to refresh projects list
      if (onProjectArchived) {
        onProjectArchived();
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      // Could add toast notification here for better UX
      alert(error instanceof Error ? error.message : 'Failed to archive project');
    } finally {
      setArchiving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Project cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
          Memory Bank Projects
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Browse and search through your project documentation. Each project contains 
          structured memory bank files that capture important context and knowledge.
        </p>
      </div>

      {/* Search and Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects ({projects.length})
          </h2>
          {searchTerm && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProjects.length} of {projects.length} projects shown
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
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

      {/* No Projects */}
      {filteredProjects.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            No projects are available in your memory bank. Check your MEMORY_BANK_ROOT 
            configuration and ensure you have project directories set up.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {filteredProjects.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects match your search
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search terms or{' '}
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              clear the search
            </button>
            {' '}to see all projects.
          </p>
        </div>
      )}

      {/* Project Grid */}
      {filteredProjects.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.name}
              href={`/projects/${encodeURIComponent(project.name)}`}
              className="group block"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 
                            hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 
                            transition-all duration-200 group-hover:-translate-y-1 p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={(e) => handleCopyTitle(project.name, e)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                               transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ cursor: 'pointer' }}
                      title={copiedProject === project.name ? 'Copied!' : 'Copy project name'}
                      aria-label={`Copy project name: ${project.name}`}
                    >
                      {copiedProject === project.name ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <ClipboardIcon className="w-4 h-4" />
                      )}
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white 
                                 group-hover:text-blue-600 dark:group-hover:text-blue-400 
                                 transition-colors line-clamp-2 flex-1">
                      {project.name}
                    </h3>
                  </div>
                  <DocumentTextIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 
                                             transition-colors flex-shrink-0 ml-2" />
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                    {project.description}
                  </p>
                )}

                {/* Project Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>{project.fileCount} files</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(project.lastModified)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setArchiveConfirm(project.name);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 
                             transition-colors rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                             disabled:opacity-50"
                    style={{ cursor: archiving === project.name ? 'not-allowed' : 'pointer' }}
                    title="Archive project"
                    aria-label={`Archive project: ${project.name}`}
                    disabled={archiving === project.name}
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {archiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Archive Project
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to archive <strong>'{archiveConfirm}'</strong>? 
              This will move the entire project to the archive directory. This action can be undone by manually moving the project back.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setArchiveConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                         transition-colors disabled:opacity-50"
                style={{ cursor: archiving === archiveConfirm ? 'not-allowed' : 'pointer' }}
                disabled={archiving === archiveConfirm}
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleArchiveProject(archiveConfirm)}
                className="px-4 py-2 text-sm font-medium text-white 
                         bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:ring-offset-2 rounded-lg
                         disabled:opacity-50 transition-colors"
                style={{ cursor: archiving === archiveConfirm ? 'not-allowed' : 'pointer' }}
                disabled={archiving === archiveConfirm}
              >
                {archiving === archiveConfirm ? 'Archiving...' : 'Archive Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}