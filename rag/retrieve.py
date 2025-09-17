from __future__ import annotations

from typing import List, Dict, Tuple
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi

from .config import RAGConfig
from .types import Chunk, ScoredChunk, SignalScores
from .utils import read_json, read_jsonl, tokenize


class LoadedIndex:
    def __init__(self, config: RAGConfig):
        self.config = config
        self.index_dir = config.index_dir
        self.meta_dir = self.index_dir / "meta"
        self.emb_dir = self.index_dir / "embeddings"
        self.bm25_dir = self.index_dir / "bm25"

        self.chunks = [Chunk(**row) for row in read_jsonl(self.meta_dir / "chunks.jsonl")]

        # Load embeddings
        self.embeddings = None
        embs_path = self.emb_dir / "embeddings.npy"
        if embs_path.exists():
            self.embeddings = np.load(embs_path)
            # embeddings should already be L2-normalized by embed_texts

        # Load BM25
        bm25_corpus = read_json(self.bm25_dir / "corpus.json")
        tokenized_corpus = [tokenize(doc) for doc in bm25_corpus["documents"]]
        self.bm25 = BM25Okapi(tokenized_corpus)
        self.bm25_chunk_ids = bm25_corpus["chunk_ids"]
        self.chunk_id_to_idx = {cid: i for i, cid in enumerate(self.bm25_chunk_ids)}


def reciprocal_rank_fusion(ranks: Dict[str, int], k: int) -> float:
    score = 0.0
    for _, r in ranks.items():
        if r is not None:
            score += 1.0 / (k + r)
    return score


def topk_indices(scores: np.ndarray, k: int, largest: bool = True) -> List[int]:
    if len(scores) == 0:
        return []
    if k >= len(scores):
        idx = np.argsort(scores)
        return idx[::-1].tolist() if largest else idx.tolist()
    if largest:
        idx = np.argpartition(scores, -k)[-k:]
        return idx[np.argsort(scores[idx])][::-1].tolist()
    else:
        idx = np.argpartition(scores, k)[:k]
        return idx[np.argsort(scores[idx])].tolist()


def cosine_search(query: str, embeddings: np.ndarray, model_name: str, top_k: int) -> Tuple[np.ndarray, List[int]]:
    if embeddings is None or len(embeddings) == 0:
        return np.array([]), []
    from .embeddings import embed_texts

    q = embed_texts([query], model_name)[0]
    # embeddings and q are normalized, cosine = dot
    scores = embeddings @ q
    idxs = topk_indices(scores, min(top_k, embeddings.shape[0]), largest=True)
    return scores, idxs


def retrieve(config: RAGConfig, query: str) -> List[ScoredChunk]:
    li = LoadedIndex(config)

    # BM25
    bm25_scores = li.bm25.get_scores(tokenize(query))
    bm25_top_idx = topk_indices(np.array(bm25_scores), config.k_bm25, largest=True)

    # Vector
    vector_scores = np.array([])
    vector_top_idx: List[int] = []
    if li.embeddings is not None:
        scores, idxs = cosine_search(query, li.embeddings, config.embedding_model_name, config.k_vector)
        vector_scores = scores
        vector_top_idx = idxs

    # Rank maps
    bm25_rank_map: Dict[int, int] = {i: rank for rank, i in enumerate(bm25_top_idx)}
    vector_rank_map: Dict[int, int] = {i: rank for rank, i in enumerate(vector_top_idx)}

    # Union
    candidate_idxs = sorted(set(bm25_top_idx) | set(vector_top_idx))

    # Fuse
    fused_results: List[Tuple[int, float, SignalScores]] = []
    for idx in candidate_idxs:
        bm25_rank = bm25_rank_map.get(idx)
        vec_rank = vector_rank_map.get(idx)
        rranks = {}
        if bm25_rank is not None:
            rranks["bm25"] = bm25_rank
        if vec_rank is not None:
            rranks["vector"] = vec_rank
        fused_score = reciprocal_rank_fusion(rranks, config.rrf_k)
        sig = SignalScores(
            bm25_score=float(bm25_scores[idx]) if idx < len(bm25_scores) else None,
            bm25_rank=(bm25_rank + 1) if bm25_rank is not None else None,
            vector_score=float(vector_scores[idx]) if idx in vector_top_idx else None,
            vector_rank=(vec_rank + 1) if vec_rank is not None else None,
        )
        fused_results.append((idx, fused_score, sig))

    fused_results.sort(key=lambda x: x[1], reverse=True)
    fused_results = fused_results[: config.k_fused]

    out: List[ScoredChunk] = []
    for rank, (idx, fused_score, sig) in enumerate(fused_results, start=1):
        out.append(
            ScoredChunk(
                chunk=li.chunks[idx],
                fused_score=float(fused_score),
                fused_rank=rank,
                signals=sig,
            )
        )

    return out 