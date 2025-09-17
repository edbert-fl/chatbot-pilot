from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer

_model_cache = {}


def get_model(model_name: str) -> SentenceTransformer:
    if model_name not in _model_cache:
        _model_cache[model_name] = SentenceTransformer(model_name)
    return _model_cache[model_name]


def embed_texts(texts: List[str], model_name: str) -> np.ndarray:
    model = get_model(model_name)
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=False, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype("float32") 