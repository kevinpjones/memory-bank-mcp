import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const projectName = decodeURIComponent(params.id);
    const filePath = params.path.map(segment => decodeURIComponent(segment)).join('/');
    
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
    
    // Get file content
    const content = await memoryBankService.getFileContent(projectName, filePath);
    
    if (content === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          message: `File "${filePath}" does not exist in project "${projectName}"`,
        },
        { status: 404 }
      );
    }
    
    // Get file metadata
    const files = await memoryBankService.getProjectFiles(projectName);
    const fileInfo = files.find(f => f.path === filePath);
    
    return NextResponse.json({
      success: true,
      data: {
        content,
        file: fileInfo || {
          name: filePath,
          path: filePath,
          size: content.length,
          lastModified: new Date(),
          isMarkdown: filePath.toLowerCase().endsWith('.md'),
        },
        project: {
          name: projectName,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch file content:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch file content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}