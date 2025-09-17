# RAG Demo: Provenance-First Retrieval

This walkthrough builds a local index from the sample policies and runs a variety of queries, showing fused rankings, per-signal scores, and exact sources used.

## 1) Install
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2) Build the index
```bash
python -m rag.cli build-index \
  --index-dir ./local_index \
  --input-path ./samples \
  --model sentence-transformers/all-MiniLM-L6-v2
```

Artifacts are written under `local_index/`:
- `meta/config.json`, `meta/documents.jsonl`, `meta/chunks.jsonl`
- `embeddings/embeddings.npy`
- `bm25/corpus.json`

## 3) Run queries (pretty table)
- Account statements and transaction logs retention:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How long do we retain account statements and transaction logs?"
```
- Mortgage file retention requirements:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "What is the retention period for mortgage files?"
```
- Deletion processing and backup purge windows:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How fast are deletion requests processed and when are backups purged?"
```
- Voice recordings and security log retention:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How long are voice recordings and security logs retained?"
```
- Encryption and TLS requirements:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "What encryption is used at rest and in transit? Do we use mTLS?"
```
- Incident response phases and timelines:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "What are our incident response phases and the review timeline?"
```
- Vulnerability remediation SLAs:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "What are the SLAs for remediating critical, high, and medium vulnerabilities?"
```
- Third-party risk and audit rights:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How do we manage third-party risk and what audit rights do we have?"
```
- Privacy rights and whether personal data is sold:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "How can customers request data access or deletion, and do we sell personal information?"
```
- DPA: subprocessor authorization and obligations:
```bash
python -m rag.cli query --index-dir ./local_index --pretty "Can we object to new subprocessors and what obligations must they meet?"
```

Tip: Adjust retrieval knobs to compare signals (example: increase vector recall):
```bash
python -m rag.cli query --index-dir ./local_index --k-bm25 5 --k-vector 20 --k-fused 10 --pretty "retention schedule and deletion timeframe"
```

## 4) JSON output (for compliance logs)
- Emit detailed per-result scoring and provenance as JSON:
```bash
python -m rag.cli query --index-dir ./local_index --json "account statements retention and deletion backups"
```
- More examples (copy/paste):
```bash
python -m rag.cli query --index-dir ./local_index --json "AES-256 at rest and TLS versions in use"
python -m rag.cli query --index-dir ./local_index --json "incident response review within 72 hours"
python -m rag.cli query --index-dir ./local_index --json "vulnerability remediation timelines critical high medium"
python -m rag.cli query --index-dir ./local_index --json "privacy rights: access, deletion, do we sell data"
python -m rag.cli query --index-dir ./local_index --json "DPA subprocessor authorization and equivalent obligations"
```
Example JSON fields per result:
- `fused_score`, `fused_rank`
- `signals.bm25_score`, `signals.bm25_rank`, `signals.vector_score`, `signals.vector_rank`
- `provenance.source_type`, `provenance.uri`, `provenance.title`, `provenance.chunk_index`, `provenance.chunk_checksum`
- `snippet` (content excerpt)

## Notes
- Hybrid retrieval: BM25 keyword + vector cosine similarity.
- Reciprocal Rank Fusion (RRF) combines rankings for stability.
- Exact sources and checksums make outputs audit-friendly for compliance. 