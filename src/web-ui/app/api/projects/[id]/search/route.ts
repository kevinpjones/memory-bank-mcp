import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectName = decodeURIComponent(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const caseSensitive = searchParams.get('case') === 'true';
    
    if (!query || query.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing search query',
          message: 'Search query parameter "q" is required',
        },
        { status: 400 }
      );
    }
    
    // Validate project exists
    const allProjects = await memoryBankService.getProjects();
    const project = allProjects.find(p => p.name === projectName);
    
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: `Project "${projectName}" does not exist`,
        },
        { status: 404 }
      );
    }
    
    // Perform search
    const searchResults = await memoryBankService.searchInProject(
      projectName,
      query.trim(),
      caseSensitive
    );
    
    return NextResponse.json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    console.error('Failed to perform search:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}