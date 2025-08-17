'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { ProjectInfo } from '@/lib/memory-bank';

interface ProjectListProps {
  projects: ProjectInfo[];
  loading?: boolean;
}

export default function ProjectList({ projects, loading }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white 
                               group-hover:text-blue-600 dark:group-hover:text-blue-400 
                               transition-colors line-clamp-2">
                    {project.name}
                  </h3>
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
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>{project.fileCount} files</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(project.lastModified)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}