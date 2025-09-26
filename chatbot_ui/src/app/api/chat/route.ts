import { NextRequest, NextResponse } from 'next/server';

const RAG_API_BASE = process.env.RAG_API_BASE || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const payload = {
      query: body.query || '',
      max_context_chunks: body.max_context_chunks || 5,
      model: body.model,
      session_id: body.session_id,
      selections: body.selections,
      message_generation: body.message_generation || false,
    };

    const response = await fetch(`${RAG_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        answer: `Error contacting backend: ${error}`,
        citations: [],
        retrieval_metadata: { error: String(error) }
      },
      { status: 500 }
    );
  }
}
