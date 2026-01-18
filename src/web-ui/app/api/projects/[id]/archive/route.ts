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
    // If this fails, we need to rollback the project move to avoid orphaned history
    const historyExists = await fs.pathExists(historyPath);
    if (historyExists) {
      try {
        await fs.move(historyPath, archivedHistoryPath);
      } catch (historyError) {
        // Rollback: move project back to original location
        console.error('Failed to move history, rolling back project archive:', historyError);
        try {
          await fs.move(archivePath, projectPath);
        } catch (rollbackError) {
          // Critical: both history move and rollback failed
          console.error('Critical: Rollback failed after history move failure:', rollbackError);
          return NextResponse.json(
            {
              success: false,
              error: 'Critical archive failure',
              message: `Project was moved to archive but history move failed and rollback also failed. Manual intervention required. Project archived at: ${archivedProjectName}`,
            },
            { status: 500 }
          );
        }
        // Rollback succeeded, report the original history move error
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to archive project history',
            message: historyError instanceof Error ? historyError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
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