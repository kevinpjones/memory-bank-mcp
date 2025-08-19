import { NextResponse } from 'next/server';
import { memoryBankService } from '@/lib/memory-bank';

export async function GET() {
  try {
    const prompts = await memoryBankService.getPrompts();
    
    return NextResponse.json({
      success: true,
      data: prompts,
      count: prompts.length,
    });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}