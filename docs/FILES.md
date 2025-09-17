# Project Files Overview

This document explains what each file does and how they fit together to provide a provenance-first RAG pipeline.

## High-level flow
```
CLI (rag/cli.py)
  -> Build Index (rag/index.py)
       - Ingest files/URLs (rag/utils.py)
       - Chunk text (rag/utils.py)
       - Embed chunks (rag/embeddings.py)
       - Save artifacts (meta/, embeddings/, bm25/)
  -> Query (rag/retrieve.py)
       - BM25 keyword search (bm25/corpus.json)
       - Vector cosine search (embeddings/embeddings.npy)
       - RRF fuse + provenance (rag/types.py)
```

---

## Root files

### requirements.txt
- Python dependencies for the RAG demo.

### README.md
- Quickstart, usage, and an overview of how the pipeline works.

### DEMO.md
- Copy/paste commands to build an index and run multiple queries (pretty and JSON), with emphasis on provenance outputs.

### samples/
- Example documents used to build a demo index.
  - `policy.md`, `security.md`, `privacy.md`, `dpa.md`.

### docs/
- Documentation folder (this file lives here).

---

## Python package: `rag/`

### `rag/__init__.py`
- Exposes package modules: `types`, `config`, `utils`, `embeddings`, `index`, `retrieve`.

### `rag/types.py`
- Core dataclasses used across the pipeline.
  - `Document`: Source-level metadata (file/URL, URI, title, timestamps, checksum).
  - `Chunk`: Chunked text with `chunk_index`, `checksum`, and `extra` metadata for provenance.
  - `SignalScores`: Per-signal retrieval scores and ranks (BM25 and vector).
  - `ScoredChunk`: Final fused result with `signals` and `fused_score`/`fused_rank`.
- Used by: `index.py` (creation of `Chunk` records), `retrieve.py` (return types), `cli.py` (output formatting).

### `rag/config.py`
- `RAGConfig` dataclass centralizes settings:
  - Index settings: `index_dir`, `embedding_model_name`, chunk sizes/overlap, allowed extensions.
  - Retrieval settings: `k_bm25`, `k_vector`, `k_fused`, `rrf_k`.
- Used by: `cli.py`, `index.py`, `retrieve.py`.

### `rag/utils.py`
- Utilities for:
  - Hashing: `sha256_text`, `sha256_file` (provenance checksums).
  - I/O: read/write JSON and JSONL.
  - Text processing: `tokenize`, `chunk_text_by_words`.
  - File iteration: `iter_files` recursively scans allowed extensions.
- Used by: `index.py` (ingestion/chunking/artifact writes), `retrieve.py` (BM25 tokenization).

### `rag/embeddings.py`
- Embedding helpers using `sentence-transformers` with caching.
  - `embed_texts(texts, model_name) -> np.ndarray` returns L2-normalized float32 vectors (cosine via dot).
- Used by: `index.py` (build embeddings) and `retrieve.py` (query embedding for vector search).

### `rag/index.py`
- Builds an index from files and/or URLs.
  - Ingestion: reads local files; optional URL fetch via `requests` + `BeautifulSoup`.
  - Chunking: word-based sliding windows from `utils`.
  - Embeddings: generates chunk embeddings and saves to `embeddings/embeddings.npy`.
  - BM25: saves corpus/token data to `bm25/corpus.json`.
  - Metadata: saves `meta/config.json`, `meta/documents.jsonl`, `meta/chunks.jsonl`.
- Output artifacts under `--index-dir`:
  - `meta/` (config, documents, chunks)
  - `embeddings/` (numpy embeddings)
  - `bm25/` (BM25 corpus)
- Consumes: `RAGConfig`, `utils`, `embeddings`, `types`.

### `rag/retrieve.py`
- Executes hybrid retrieval and fusion.
  - Loads artifacts from disk.
  - BM25: keyword scores over tokenized corpus.
  - Vector: cosine similarity of query embedding vs. saved embeddings (NumPy dot-product on normalized vectors).
  - Fusion: Reciprocal Rank Fusion (RRF) across BM25/vector ranks.
  - Returns `List[ScoredChunk]` with `signals` and provenance-rich `chunk`.
- Consumes: `RAGConfig`, `types`, `utils`, `embeddings`.

### `rag/cli.py`
- Typer CLI entrypoints:
  - `build-index`: builds artifacts from `--input-path` (and optional `--urls-file`).
  - `query`: runs retrieval and prints either a pretty table or JSON with full provenance.
- Wires user inputs to `RAGConfig`, calls `index.build_index` and `retrieve.retrieve`.

---

## Generated index artifacts (under `--index-dir`)
- `meta/config.json`: capture of index settings for reproducibility.
- `meta/documents.jsonl`: one row per document (file or URL) with provenance fields.
- `meta/chunks.jsonl`: one row per chunk with `chunk_index`, `checksum`, and source linkage.
- `embeddings/embeddings.npy`: float32, L2-normalized embeddings aligned with `chunks.jsonl` indices.
- `bm25/corpus.json`: tokenized chunk texts and their corresponding `chunk_ids`.

## How components fit together
- Build time: `cli.py` → `index.py` uses `utils.py` for I/O and chunking, `embeddings.py` for vectors, and `types.py` to structure metadata; artifacts are written to disk.
- Query time: `cli.py` → `retrieve.py` loads artifacts, computes BM25 + vector scores, fuses with RRF, and returns `ScoredChunk` results that include full provenance for compliance and audit. 