# What is the Index?

In this project, the index is the set of on-disk artifacts that make retrieval fast, reproducible, and auditable. It captures both content representations (embeddings and BM25 tokens) and full provenance metadata so you always know exactly which sources influenced a result.

## Why build an index?
- Fast retrieval: Precomputes structures (embeddings and token corpora) so queries run in milliseconds.
- Reproducibility: Freezes the state used to answer a query. You can re-run queries later against the same artifacts.
- Compliance & audit: Stores provenance fields (source type, URI, titles, checksums, timestamps) for each document and chunk.

## Where is it stored?
All index artifacts live under the directory you pass to `--index-dir`. Example layout:
```
local_index/
  meta/
    config.json           # Index build settings and timestamp
    documents.jsonl       # One row per source (file/URL) with provenance
    chunks.jsonl          # One row per chunk with chunk_index and checksum
  embeddings/
    embeddings.npy        # Float32, L2-normalized vectors aligned to chunks
  bm25/
    corpus.json           # Tokenized chunk texts and their chunk_ids
```

## What are the components?
- meta/config.json
  - Embedding model, chunking parameters, created_at timestamp.
- meta/documents.jsonl
  - Document-level provenance: `source_type` (file/url), `uri`, `title`, `fetched_at`, `checksum`.
- meta/chunks.jsonl
  - Chunk-level records: `chunk_id` (SHA-256 of chunk text), `document_*` linkage, `chunk_index`, `content` (normalized tokens), `checksum`.
- embeddings/embeddings.npy
  - Numpy array (shape: num_chunks × dim). L2-normalized so cosine similarity = dot product.
  - Row i corresponds to the i-th entry in `chunks.jsonl`.
- bm25/corpus.json
  - `documents`: tokenized chunk texts (strings) used by BM25.
  - `chunk_ids`: stable identifiers aligned with `documents` to map back to chunks.

## How is the index built?
The `build-index` CLI command invokes `rag/index.py` to:
1) Ingest
   - Read local files in `--input-path` (recursive scan of .txt/.md by default).
   - Optional: fetch URLs from `--urls-file` (one URL per line) and extract visible text.
2) Chunk
   - Word-based sliding windows (default 200 words, 40 words overlap) to improve recall.
3) Embed
   - Use `sentence-transformers` to compute L2-normalized embeddings; saved to `embeddings/embeddings.npy`.
4) BM25
   - Tokenize chunk texts and store corpus in `bm25/corpus.json`.
5) Persist provenance
   - Write `documents.jsonl` and `chunks.jsonl` including checksums and linkage.

Command example:
```bash
python -m rag.cli build-index \
  --index-dir ./local_index \
  --input-path ./samples \
  --model sentence-transformers/all-MiniLM-L6-v2
```

## How is the index used to answer queries?
The `query` CLI command invokes `rag/retrieve.py` to:
1) Load artifacts
   - Read `embeddings.npy`, `bm25/corpus.json`, and `meta/chunks.jsonl`.
2) Score candidates
   - BM25: keyword relevance over tokenized chunk texts; keep top-k (`--k-bm25`).
   - Vector: cosine similarity (dot product) between query embedding and chunk embeddings; keep top-k (`--k-vector`).
3) Fuse rankings
   - Reciprocal Rank Fusion (RRF): `score = Σ 1/(K + rank_signal)` with `--rrf-k` smoothing.
4) Return results
   - Top fused results (`--k-fused`) as `ScoredChunk` objects with per-signal scores and full provenance (source type, URI, title, chunk index, checksum) for each chunk.

Pretty output example:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How long do we retain data and how fast is deletion?"
```
JSON output example:
```bash
python -m rag.cli query --index-dir ./local_index --json "retention policy"
```

## Compliance and provenance
- Checksums
  - `sha256_file` and `sha256_text` enable verifying that a given result was derived from exactly the recorded content.
- Traceability
  - Each `chunk` links back to its `document` via `document_source_id` and `document_uri`.
- Determinism
  - Artifacts are plain files, making investigations and audits straightforward.

## Performance notes
- Current vector search uses NumPy dot product over normalized vectors (cosine similarity) with efficient top-k selection.
- For larger corpora, you can swap in an ANN index (e.g., FAISS) while keeping the same artifact/provenance design.

## Updating an index
- Rebuild
  - Running `build-index` again will rebuild artifacts from the provided inputs. For now, incremental updates are not implemented.
- Versioning
  - Use distinct `--index-dir` paths per build if you want to preserve historical snapshots for audits. 