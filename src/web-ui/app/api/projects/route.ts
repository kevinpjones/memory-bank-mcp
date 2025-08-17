import { NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET() {
  try {
    const projects = await memoryBankService.getProjects();
    
    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}