from __future__ import annotations

from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import asdict
from datetime import datetime

import numpy as np
import requests
from bs4 import BeautifulSoup

from .config import RAGConfig
from .types import Document, Chunk
from .utils import (
    iter_files,
    read_text_file,
    chunk_text_by_words,
    sha256_file,
    sha256_text,
    write_json,
    write_jsonl,
)
from .embeddings import embed_texts


class IndexArtifacts:
    def __init__(self, index_dir: Path):
        self.index_dir = index_dir
        self.meta_dir = index_dir / "meta"
        self.emb_dir = index_dir / "embeddings"
        self.bm25_dir = index_dir / "bm25"
        self.meta_dir.mkdir(parents=True, exist_ok=True)
        self.emb_dir.mkdir(parents=True, exist_ok=True)
        self.bm25_dir.mkdir(parents=True, exist_ok=True)

    @property
    def config_json(self) -> Path:
        return self.meta_dir / "config.json"

    @property
    def documents_jsonl(self) -> Path:
        return self.meta_dir / "documents.jsonl"

    @property
    def chunks_jsonl(self) -> Path:
        return self.meta_dir / "chunks.jsonl"

    @property
    def embeddings_npy(self) -> Path:
        return self.emb_dir / "embeddings.npy"

    @property
    def bm25_corpus_json(self) -> Path:
        return self.bm25_dir / "corpus.json"


def fetch_url(url: str) -> Tuple[str, str]:
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else url
    for script in soup(["script", "style", "noscript"]):
        script.extract()
    text = soup.get_text(" ")
    text = " ".join(text.split())
    return title, text


def build_index(config: RAGConfig, input_paths: List[Path], urls: List[str] | None = None) -> None:
    artifacts = IndexArtifacts(config.index_dir)

    documents: List[Document] = []
    chunks: List[Chunk] = []

    for path in iter_files(input_paths, config.allowed_file_extensions):
        text = read_text_file(path)
        checksum = sha256_file(path)
        doc = Document(
            source_id=str(path.resolve()),
            source_type="file",
            uri=str(path.resolve()),
            title=path.name,
            fetched_at=None,
            checksum=checksum,
        )
        documents.append(doc)
        chunk_texts = chunk_text_by_words(text, config.max_chunk_words, config.chunk_overlap_words)
        for i, ct in enumerate(chunk_texts):
            csum = sha256_text(ct)
            chunk = Chunk(
                chunk_id=csum,
                document_source_id=doc.source_id,
                document_uri=doc.uri,
                document_type=doc.source_type,
                content=ct,
                chunk_index=i,
                checksum=csum,
                extra={"source_title": doc.title or ""},
            )
            chunks.append(chunk)

    if urls:
        for url in urls:
            try:
                title, text = fetch_url(url)
            except Exception:
                title, text = url, ""
            checksum = sha256_text(text)
            doc = Document(
                source_id=url,
                source_type="url",
                uri=url,
                title=title,
                fetched_at=datetime.utcnow().isoformat(),
                checksum=checksum,
            )
            documents.append(doc)
            chunk_texts = chunk_text_by_words(text, config.max_chunk_words, config.chunk_overlap_words)
            for i, ct in enumerate(chunk_texts):
                csum = sha256_text(ct)
                chunk = Chunk(
                    chunk_id=csum,
                    document_source_id=doc.source_id,
                    document_uri=doc.uri,
                    document_type=doc.source_type,
                    content=ct,
                    chunk_index=i,
                    checksum=csum,
                    extra={"source_title": doc.title or ""},
                )
                chunks.append(chunk)

    write_json(artifacts.config_json, {
        "embedding_model_name": config.embedding_model_name,
        "max_chunk_words": config.max_chunk_words,
        "chunk_overlap_words": config.chunk_overlap_words,
        "created_at": datetime.utcnow().isoformat(),
    })
    write_jsonl(artifacts.documents_jsonl, (asdict(d) for d in documents))
    write_jsonl(artifacts.chunks_jsonl, (asdict(c) for c in chunks))

    contents = [c.content for c in chunks]
    if contents:
        embs = embed_texts(contents, config.embedding_model_name)
        np.save(artifacts.embeddings_npy, embs)

    bm25_corpus = {
        "documents": [c.content for c in chunks],
        "chunk_ids": [c.chunk_id for c in chunks],
    }
    write_json(artifacts.bm25_corpus_json, bm25_corpus)

    return None 