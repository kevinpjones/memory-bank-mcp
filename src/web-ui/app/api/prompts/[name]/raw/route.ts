import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const promptName = decodeURIComponent(resolvedParams.name);
    
    const rawContent = await memoryBankService.getPromptRawContent(promptName);
    
    if (rawContent === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt not found',
          message: `Prompt "${promptName}" does not exist`,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        name: promptName,
        content: rawContent,
      },
    });
  } catch (error) {
    console.error('Failed to fetch raw prompt content:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch raw prompt content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const promptName = decodeURIComponent(resolvedParams.name);
    
    const body = await request.json();
    const { content } = body;
    
    if (typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Content must be a string',
        },
        { status: 400 }
      );
    }
    
    await memoryBankService.savePromptRawContent(promptName, content);
    
    return NextResponse.json({
      success: true,
      data: {
        name: promptName,
        message: 'Prompt saved successfully',
      },
    });
  } catch (error) {
    console.error('Failed to save prompt content:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save prompt content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}