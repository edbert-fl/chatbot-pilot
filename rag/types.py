from dataclasses import dataclass, field
from typing import Dict, Optional
from datetime import datetime


@dataclass
class Document:
    source_id: str  # Path or URL
    source_type: str  # "file" or "url"
    uri: str  # Redundant but explicit for provenance
    title: Optional[str] = None
    fetched_at: Optional[str] = None  # ISO timestamp if fetched from URL
    checksum: Optional[str] = None


@dataclass
class Chunk:
    chunk_id: str
    document_source_id: str
    document_uri: str
    document_type: str  # "file" or "url"
    content: str
    chunk_index: int
    checksum: str
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    extra: Dict[str, str] = field(default_factory=dict)


@dataclass
class SignalScores:
    bm25_score: Optional[float] = None
    bm25_rank: Optional[int] = None
    vector_score: Optional[float] = None  # cosine similarity
    vector_rank: Optional[int] = None


@dataclass
class ScoredChunk:
    chunk: Chunk
    fused_score: float
    fused_rank: int
    signals: SignalScores 