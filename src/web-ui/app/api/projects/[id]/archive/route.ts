import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';
import path from 'path';
import fs from 'fs-extra';
import { config } from '@/lib/memory-bank';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectName } = await params;
    
    if (!projectName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    // Check if project exists
    const projects = await memoryBankService.getProjects();
    const project = projects.find(p => p.name === projectName);
    
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Archive the entire project directory
    const projectPath = path.join(config.memoryBankRoot, projectName);
    const historyPath = path.join(config.memoryBankRoot, '.history', projectName);
    const archiveBasePath = path.join(config.memoryBankRoot, '.archive');
    
    // Create archive directory if it doesn't exist
    await fs.ensureDir(archiveBasePath);
    
    // Generate timestamped archive directory name
    const timestamp = new Date().toISOString().replace(/:/g, '_').replace(/\./g, '_');
    const archivedProjectName = `${projectName}-ARCHIVED-${timestamp}`;
    const archivePath = path.join(archiveBasePath, archivedProjectName);
    const archivedHistoryPath = path.join(archiveBasePath, `${archivedProjectName}.history`);

    // Move the entire project directory to archive
    await fs.move(projectPath, archivePath);

    // Move project history to archive (if it exists)
    if (await fs.pathExists(historyPath)) {
      await fs.move(historyPath, archivedHistoryPath);
    }

    return NextResponse.json({
      success: true,
      message: `Project '${projectName}' has been archived successfully`,
      archivedAs: archivedProjectName,
    });
  } catch (error) {
    console.error('Failed to archive project:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}