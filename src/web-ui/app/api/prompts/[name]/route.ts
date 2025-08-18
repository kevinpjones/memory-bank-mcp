import { NextRequest, NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const promptName = decodeURIComponent(resolvedParams.name);
    
    const prompt = await memoryBankService.getPrompt(promptName);
    
    if (!prompt) {
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
      data: prompt,
    });
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prompt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}