import re
import os
import hashlib
from pathlib import Path
from typing import Iterable, List, Dict, Generator, Tuple
from dataclasses import asdict
import orjson

WORD_RE = re.compile(r"\w+", re.UNICODE)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def tokenize(text: str) -> List[str]:
    return WORD_RE.findall(text.lower())


def read_text_file(path: Path) -> str:
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def write_json(path: Path, data: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(orjson.dumps(data, option=orjson.OPT_INDENT_2))


def write_jsonl(path: Path, rows: Iterable[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as f:
        for row in rows:
            f.write(orjson.dumps(row))
            f.write(b"\n")


def read_json(path: Path) -> Dict:
    return orjson.loads(path.read_bytes())


def read_jsonl(path: Path) -> List[Dict]:
    out = []
    with path.open("rb") as f:
        for line in f:
            if line.strip():
                out.append(orjson.loads(line))
    return out


def iter_files(paths: List[Path], allowed_exts: Tuple[str, ...]) -> Generator[Path, None, None]:
    seen = set()
    for p in paths:
        if p.is_file():
            if p.suffix.lower() in allowed_exts and p not in seen:
                seen.add(p)
                yield p
        elif p.is_dir():
            for root, _, files in os.walk(p):
                for name in files:
                    fpath = Path(root) / name
                    if fpath.suffix.lower() in allowed_exts and fpath not in seen:
                        seen.add(fpath)
                        yield fpath


def chunk_text_by_words(text: str, max_words: int, overlap_words: int) -> List[str]:
    tokens = tokenize(text)
    if not tokens:
        return []
    chunks: List[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + max_words, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(" ".join(chunk_tokens))
        if end == len(tokens):
            break
        start = end - overlap_words
        if start < 0:
            start = 0
    return chunks 