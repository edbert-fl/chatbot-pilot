from dataclasses import dataclass
from pathlib import Path


@dataclass
class RAGConfig:
    index_dir: Path
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    max_chunk_words: int = 200
    chunk_overlap_words: int = 40
    allowed_file_extensions: tuple = (".txt", ".md")

    # Retrieval settings
    k_bm25: int = 8
    k_vector: int = 8
    k_fused: int = 8
    rrf_k: int = 60  # RRF constant to smooth reciprocal ranks 