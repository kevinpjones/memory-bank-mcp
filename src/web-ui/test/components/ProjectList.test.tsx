import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import ProjectList from '@/components/ProjectList';
import { ProjectInfo } from '@/lib/memory-bank';

const mockProjects: ProjectInfo[] = [
  {
    name: 'Test Project 1',
    description: 'A test project for memory bank',
    lastModified: new Date('2024-01-01'),
    fileCount: 5,
  },
  {
    name: 'Another Project',
    description: 'Another project for testing',
    lastModified: new Date('2024-01-02'),
    fileCount: 3,
  },
  {
    name: 'API Documentation',
    lastModified: new Date('2024-01-03'),
    fileCount: 10,
  },
];

describe('ProjectList', () => {
  test('renders project list correctly', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('Memory Bank Projects')).toBeInTheDocument();
    expect(screen.getByText('Projects (3)')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Another Project')).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
  });

  test('displays project descriptions when available', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('A test project for memory bank')).toBeInTheDocument();
    expect(screen.getByText('Another project for testing')).toBeInTheDocument();
  });

  test('displays file counts correctly', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('5 files')).toBeInTheDocument();
    expect(screen.getByText('3 files')).toBeInTheDocument();
    expect(screen.getByText('10 files')).toBeInTheDocument();
  });

  test('filters projects based on search input', async () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Another project for testing')).toBeInTheDocument();
    expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
    
    expect(screen.getByText('2 of 3 projects shown')).toBeInTheDocument();
  });

  test('shows no results message when search yields no matches', () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No projects match your search')).toBeInTheDocument();
    expect(screen.getByText('clear the search')).toBeInTheDocument();
  });

  test('shows loading state correctly', () => {
    render(<ProjectList projects={[]} loading={true} />);
    
    // Should show skeleton loaders instead of main content
    expect(screen.queryByText('Memory Bank Projects')).not.toBeInTheDocument();
    expect(screen.queryByText('Projects (0)')).not.toBeInTheDocument();
  });

  test('shows empty state when no projects are available', () => {
    render(<ProjectList projects={[]} />);
    
    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText(/No projects are available in your memory bank/)).toBeInTheDocument();
  });

  test('clears search when clear button is clicked', () => {
    render(<ProjectList projects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects by name or description...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No projects match your search')).toBeInTheDocument();
    
    const clearButton = screen.getByText('clear the search');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });
});