# RAG → Chatbot Integration Plan

This document outlines how to turn the provenance-first RAG pipeline into a production chatbot that answers questions with citations and compliance-friendly logging.

## Goals
- Ground all answers strictly in retrieved sources; show exact citations and checksums.
- Provide fast, helpful responses with transparent ranking signals.
- Enforce safety, privacy, and auditability (traceability by design).

## Target architecture (high-level)
```
Client (Web/CLI)
  ↕ HTTPS / SSE
Chat Orchestrator (FastAPI)
  ├─ Retrieval Service (this repo’s RAG: BM25+Vector+RRF)
  ├─ LLM Provider (OpenAI/Azure/Open-Source via vLLM/LLM Gateway)
  ├─ Memory (ephemeral per-session, optional vector memory)
  ├─ Safety/PII Guard (redaction, policy checks)
  └─ Observability (metrics, traces, structured logs)
Artifacts (index_dir)
  ├─ meta/ (config, documents.jsonl, chunks.jsonl)
  ├─ embeddings/ (embeddings.npy)
  └─ bm25/ (corpus.json)
```

## Components
- Retrieval service
  - Use existing `rag.retrieve.retrieve` to get top-k `ScoredChunk`s with provenance and signals.
  - Optionally add reranking (cross-encoder) and diversity (MMR) in a second pass.
- Chat orchestrator (FastAPI)
  - Implements `/chat` endpoint (JSON and streaming) and `/healthz`.
  - Calls retrieval → formats prompt → calls LLM → assembles answer with citations.
- LLM provider abstraction
  - Pluggable backend (OpenAI/Azure/Gemini/vLLM). Support JSON mode or tool calling where useful.
- Memory
  - Short-term: conversation buffer (limited turn window) stored in session.
  - Optional: vector memory per-session for follow-ups (disabled by default for compliance).
- Safety & compliance
  - PII redaction on inputs/outputs where required.
  - Grounding policy: refuse or caution when no sufficient sources.
  - Structured, immutable logs with hashes of prompts, retrieved chunk ids, and output.
- Observability
  - Metrics (latency, retrieval time, LLM tokens), traces (OpenTelemetry), error rates.

## API design
- POST /chat (non-stream)
```http
POST /chat
Content-Type: application/json
{
  "session_id": "uuid",
  "message": "User question",
  "top_k": 8,
  "k_bm25": 8,
  "k_vector": 8,
  "rrf_k": 60,
  "index_dir": "./local_index"
}
→ 200 OK
{
  "answer": "... grounded answer ...",
  "citations": [
    {
      "uri": "file:///.../bank_retention_policy.md",
      "title": "Bank Data Retention and Deletion Policy",
      "chunk_index": 2,
      "checksum": "<sha256>",
      "signals": {"bm25_score": 5.12, "bm25_rank": 1, "vector_score": 0.74, "vector_rank": 1},
      "snippet": "..."
    }
  ],
  "retrieval": {
    "query": "User question",
    "k": {"bm25": 8, "vector": 8, "fused": 8, "rrf_k": 60},
    "latency_ms": {"retrieval": 18, "llm": 420}
  }
}
```
- GET /chat/stream (SSE)
  - Same request body; response is Server-Sent Events: tokens, heartbeat, final citations block.

## Prompting and answer assembly
- Grounded answer template
```text
You are a banking assistant. Answer only with information supported by the provided context. 
If the context lacks an answer, say you don’t know. Include inline citations [n] that map to sources below.

Question: {user_question}

Context passages:
{context_blocks}

Instructions:
- Synthesize a concise answer (<= 6 sentences unless asked for more)
- Use exact figures and timelines from the context
- Add inline citations like [1], [2] where claims are made
- If sources conflict, state the discrepancy and prefer the most specific policy
```
- Context block format
```text
[1] {title} — {uri} (chunk #{chunk_index})
   checksum: {checksum}
   excerpt: {snippet}
```
- Post-processing
  - Ensure each bracketed citation [n] references an included source; append a “Sources” section listing them.
  - If no citations present, downgrade answer and return a “no sufficient evidence” message.

## Retrieval enhancements (optional roadmap)
- Query rewriting: generate 2–4 paraphrases (multi-query) and merge with RRF.
- Diversity: MMR on top of fused results to reduce redundancy.
- Reranking: cross-encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`) reorders top 50.
- Filters: domain/path filters, time filters, or section tags in `Chunk.extra`.
- Dynamic k: widen k when confidence is low (few consistent hits), narrow when abundant.

## Memory policy
- Default: stateless retrieval per turn; short buffer of last N user+assistant turns for coherence.
- Compliance toggle: disallow retention of user content across sessions; purge buffers on end.
- Optional: store feedback (thumbs up/down) per citation to refine boosting.

## Safety & compliance
- PII redaction: basic detection on input and output; do not echo sensitive IDs unless present in sources and necessary.
- Refusal policy: when sources do not cover the request, respond with guidance and request more details.
- Logging: store request id, session id, retrieval params, chunk ids, checksums, and model id; avoid storing full user text if not required.
- Data minimization: only pass minimal snippets to the LLM that are needed to answer.

## Caching & performance
- Cache embeddings for frequent queries; cache retrieval results by normalized query.
- Pre-warm model and keep a small threadpool for retrieval and LLM calls.
- Batch requests when streaming is not required.

## Evaluation
- Offline: labeled Q/A pairs with expected citation URIs/chunks.
- Metrics: answer accuracy, citation correctness, groundedness (no hallucinations), coverage, latency.
- Online: user feedback collection and A/B of retrieval params (k values, reranker).

## Minimal server skeleton (future)
```python
# app/server.py (sketch)
from fastapi import FastAPI
from pydantic import BaseModel
from rag.config import RAGConfig
from rag.retrieve import retrieve

app = FastAPI()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    index_dir: str
    k_bm25: int = 8
    k_vector: int = 8
    k_fused: int = 8
    rrf_k: int = 60

@app.post("/chat")
def chat(req: ChatRequest):
    cfg = RAGConfig(index_dir=Path(req.index_dir), k_bm25=req.k_bm25, k_vector=req.k_vector, k_fused=req.k_fused, rrf_k=req.rrf_k)
    results = retrieve(cfg, req.message)
    # format context → prompt → call LLM → assemble answer + citations
    return {"answer": "TODO", "citations": [], "retrieval": {}}
```

## Rollout steps
1) Add a small FastAPI service with `/chat` and `/healthz`.
2) Implement prompt assembly and citation rendering.
3) Add streaming via SSE or WebSockets.
4) Add safety/PII guard and structured logging.
5) Add evaluation harness and feedback capture.
6) Optional: add multi-query, MMR, and reranker.

## Appendix: UI notes
- Show inline citation numbers; hover reveals source title, chunk index, and snippet.
- Provide a “Show sources” panel with full provenance (URI, checksum) and ability to open the original.
- Include a toggle for “evidence-only answers” that disables model extrapolation. 