# Chatbot Pilot - Provenance-First RAG Demo

This project demonstrates a compliance-friendly Retrieval-Augmented Generation (RAG) pipeline that emphasizes data provenance. It focuses on ingestion, hybrid retrieval (BM25 + vector), rank fusion, and transparent outputs that show exactly which sources were used and how they were ranked.

## Features

- Hybrid retrieval: BM25 (keyword) + FAISS (vector cosine similarity)
- Reciprocal Rank Fusion (RRF) to combine rankings
- Deterministic, reproducible indexing with on-disk artifacts
- Fully transparent provenance and per-signal scoring data
- Typer-based CLI with pretty and JSON outputs

## How it works

- Ingestion
  - Scans files in `--input-path` (default: `.txt`, `.md`) and optionally fetches URLs from `--urls-file`.
  - Extracts text and records provenance: `source_type` (file/url), `uri`, `title`, timestamps, and checksums.
- Chunking
  - Word-based sliding window: default 200 words per chunk with 40-word overlap for better recall.
  - Each chunk stores `chunk_index` and a `checksum` (SHA-256) for auditability.
- Embeddings (vector index)
  - Uses `sentence-transformers/all-MiniLM-L6-v2` by default; L2-normalized vectors enable cosine via dot product.
  - Persisted to `embeddings/embeddings.npy` for reproducible, inspectable state.
- BM25 (keyword index)
  - Tokenizes chunks and builds a BM25 corpus stored at `bm25/corpus.json`.
- Retrieval
  - For a query, compute:
    - BM25 scores for all chunks; keep top-k (`--k-bm25`).
    - Cosine similarities between query embedding and chunk embeddings; keep top-k (`--k-vector`).
  - Fuse rankings via Reciprocal Rank Fusion: score = Σ 1 / (K + rank_signal). Default `K` is `--rrf-k` (60).
  - Return top-k fused (`--k-fused`) with per-signal scores/ranks and full provenance.
- Artifacts on disk (for compliance/audit)
  - `meta/config.json`: index settings
  - `meta/documents.jsonl`: one row per source document
  - `meta/chunks.jsonl`: one row per chunk with checksums
  - `embeddings/embeddings.npy`: chunk embeddings (float32, L2-normalized)
  - `bm25/corpus.json`: tokenized corpus and chunk ids

Pipeline (high-level):

```
Ingest (files/urls) -> Chunk -> Embeddings (.npy) + BM25 (corpus.json)
Query -> BM25 top-k + Cosine top-k -> RRF fuse -> Results + Provenance
```

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Build an index

```bash
python -m rag.cli build-index \
  --index-dir ./local_index \
  --input-path ./samples \
  --model sentence-transformers/all-MiniLM-L6-v2
```

- You can specify multiple `--input-path` flags. Directories are scanned recursively for `.txt` and `.md`.
- To ingest URLs, pass `--urls-file urls.txt` with one URL per line.

## Query with full provenance

```bash
python -m rag.cli query \
  --index-dir ./local_index \
  --k-bm25 8 --k-vector 8 --k-fused 8 \
  --pretty "How do we handle retention and deletion?"
```

JSON output:

```bash
python -m rag.cli query --index-dir ./local_index --json "privacy policy retention"
```

Each result includes:

- Fused score and ranks from each signal
- BM25 score and rank
- Vector cosine similarity and rank
- Source provenance: type, URI/path, title (for URLs), chunk index, checksum
- A short content snippet

## Notes

- Embeddings use `sentence-transformers/all-MiniLM-L6-v2` by default.
- FAISS uses inner-product on L2-normalized vectors (cosine similarity).
- BM25 is powered by `rank-bm25`.
- Index artifacts are plain files under `--index-dir` for auditability.

## License

MIT
