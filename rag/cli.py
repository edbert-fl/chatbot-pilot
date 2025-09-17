from __future__ import annotations

from pathlib import Path
from typing import Optional, List

import typer
from rich.console import Console
from rich.table import Table

from .config import RAGConfig
from .index import build_index
from .retrieve import retrieve

app = typer.Typer(add_completion=False)
console = Console()


@app.command(name="build-index")
def build_index_cmd(
    index_dir: Path = typer.Option(..., exists=False, dir_okay=True, file_okay=False, writable=True),
    input_path: List[Path] = typer.Option([], help="Files or directories to ingest"),
    urls_file: Optional[Path] = typer.Option(None, help="File with one URL per line"),
    model: str = typer.Option("sentence-transformers/all-MiniLM-L6-v2", help="Embedding model"),
    max_chunk_words: int = typer.Option(200),
    chunk_overlap_words: int = typer.Option(40),
):
    urls: List[str] = []
    if urls_file and urls_file.exists():
        urls = [line.strip() for line in urls_file.read_text().splitlines() if line.strip()]

    cfg = RAGConfig(
        index_dir=index_dir,
        embedding_model_name=model,
        max_chunk_words=max_chunk_words,
        chunk_overlap_words=chunk_overlap_words,
    )

    build_index(cfg, input_path, urls)
    console.print(f"[green]Index built at[/green] {index_dir}")


@app.command()
def query(
    query: str = typer.Argument(...),
    index_dir: Path = typer.Option(..., exists=True, file_okay=False, dir_okay=True, readable=True),
    k_bm25: int = typer.Option(8),
    k_vector: int = typer.Option(8),
    k_fused: int = typer.Option(8),
    rrf_k: int = typer.Option(60),
    json: bool = typer.Option(False, "--json", help="Emit JSON instead of pretty table"),
    pretty: bool = typer.Option(False, "--pretty", help="Pretty table output"),
):
    cfg = RAGConfig(
        index_dir=index_dir,
        k_bm25=k_bm25,
        k_vector=k_vector,
        k_fused=k_fused,
        rrf_k=rrf_k,
    )

    results = retrieve(cfg, query)

    if json:
        import orjson
        from dataclasses import asdict

        payload = []
        for r in results:
            payload.append(
                {
                    "fused_score": r.fused_score,
                    "fused_rank": r.fused_rank,
                    "signals": asdict(r.signals),
                    "chunk": asdict(r.chunk),
                    "provenance": {
                        "source_type": r.chunk.document_type,
                        "uri": r.chunk.document_uri,
                        "title": r.chunk.extra.get("source_title", ""),
                        "chunk_index": r.chunk.chunk_index,
                        "chunk_checksum": r.chunk.checksum,
                    },
                    "snippet": r.chunk.content[:280],
                }
            )
        console.print(orjson.dumps(payload, option=orjson.OPT_INDENT_2).decode("utf-8"))
        return

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Rank", justify="right")
    table.add_column("Fused")
    table.add_column("BM25 (rank)")
    table.add_column("Vector (rank)")
    table.add_column("Source")
    table.add_column("Snippet")

    for r in results:
        source = f"{r.chunk.document_type}: {r.chunk.document_uri} [#{r.chunk.chunk_index}]"
        bm25 = "-"
        if r.signals.bm25_score is not None:
            bm25 = f"{r.signals.bm25_score:.4f} ({r.signals.bm25_rank})"
        vec = "-"
        if r.signals.vector_score is not None:
            vec = f"{r.signals.vector_score:.4f} ({r.signals.vector_rank})"

        table.add_row(
            str(r.fused_rank),
            f"{r.fused_score:.4f}",
            bm25,
            vec,
            source,
            (r.chunk.content[:160] + ("…" if len(r.chunk.content) > 160 else "")),
        )

    console.print(table)


if __name__ == "__main__":
    app() 