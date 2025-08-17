import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectName = decodeURIComponent(resolvedParams.id);
    
    // Get project info
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
    
    // Get project files
    const files = await memoryBankService.getProjectFiles(projectName);
    
    return NextResponse.json({
      success: true,
      data: {
        project,
        files,
      },
    });
  } catch (error) {
    console.error('Failed to fetch project details:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}