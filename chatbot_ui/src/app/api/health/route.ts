import { NextResponse } from 'next/server';

const RAG_API_BASE = process.env.RAG_API_BASE || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const response = await fetch(`${RAG_API_BASE}/health`, {
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', detail: String(error) },
      { status: 500 }
    );
  }
}
