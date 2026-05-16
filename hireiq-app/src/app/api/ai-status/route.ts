import { NextResponse } from 'next/server';
import { checkAIHealth } from '@/lib/ai';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const health = await checkAIHealth();
    return NextResponse.json({ available: true, ...health });
  } catch {
    return NextResponse.json({
      available: false,
      status: 'offline',
      ollama_available: false,
      spacy_loaded: false,
      embedder_loaded: false,
      message: 'Python AI backend not running. Start with: cd python-backend && bash start.sh',
    });
  }
}
