import { NextResponse } from 'next/server';
import { strategyService } from '@/app/lib/strategyService';

export async function POST(request: Request) {
  try {
    const { strategyId } = await request.json();

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    const result = await strategyService.generateStrategy(strategyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to generate strategy' },
      { status: 500 }
    );
  }
} 