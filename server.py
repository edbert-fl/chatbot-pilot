#!/usr/bin/env python3
"""
REST API for WorkingRAGChatBot using FastAPI.
Exposes endpoints to check health and to perform RAG-augmented chat.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()  # Load environment variables from .env if present
except Exception:
    # Safe to continue without dotenv; env vars can still be provided by the environment
    pass

# Local imports
from retrieval_chatbot import WorkingRAGChatBot


class ChatRequest(BaseModel):
    query: str = Field(..., description="User question")
    max_context_chunks: int = Field(5, ge=1, le=20, description="How many context chunks to include")
    model: Optional[str] = Field(None, description="Override model (defaults to server's configured model)")
    session_id: Optional[str] = Field(None, description="Client-provided session identifier for memory")
    selections: Optional[Dict[str, Any]] = Field(None, description="Structured user selections (e.g., buttons/forms)")
    message_generation: Optional[bool] = Field(False, description="Flag to indicate this is for message generation, not regular chat")


class ChatResponse(BaseModel):
    answer: str
    citations: List[Dict[str, Any]]
    retrieval_metadata: Dict[str, Any]


def create_app() -> FastAPI:
    app = FastAPI(title="Chatbot Pilot RAG API", version="0.1.0")

    # Configuration from environment
    index_dir_env = os.getenv("INDEX_DIR", str(Path(__file__).parent / "local_index"))
    model_env = os.getenv("OPENAI_MODEL", os.getenv("MODEL", "gpt-3.5-turbo"))
    api_key_env = os.getenv("OPENAI_API_KEY")

    # Simple in-memory store for session context (non-persistent)
    app.state.session_context: Dict[str, Dict[str, Any]] = {}

    # Instantiate chatbot at startup so we don't reload index on every request
    @app.on_event("startup")
    def startup_event() -> None:
        try:
            app.state.index_dir = Path(index_dir_env)
            app.state.model = model_env
            app.state.chatbot = WorkingRAGChatBot(index_dir=str(app.state.index_dir), api_key=api_key_env, model=app.state.model)
        except Exception as exc:
            raise RuntimeError(f"Failed to initialize RAG chatbot: {exc}")

    @app.get("/", tags=["meta"])
    def root() -> Dict[str, Any]:
        return {
            "name": "chatbot-pilot-rag-api",
            "status": "ok",
            "model": getattr(app.state, "model", None),
            "index_dir": str(getattr(app.state, "index_dir", index_dir_env)),
        }

    @app.get("/health", tags=["meta"]) 
    def health() -> Dict[str, Any]:
        try:
            chatbot = app.state.chatbot
            return {
                "status": "ok",
                "model": app.state.model,
                "index_dir": str(app.state.index_dir),
                "chunks_loaded": len(getattr(chatbot, "chunks", [])),
                "embeddings_loaded": chatbot.embeddings is not None,
            }
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    @app.post("/generate-message", tags=["chat"])
    def generate_message_endpoint(req: ChatRequest) -> Dict[str, Any]:
        """Generate a simple message without RAG."""
        try:
            chatbot = app.state.chatbot
            result = chatbot.generate_message(req.query)
            return result
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    @app.post("/chat", response_model=ChatResponse, tags=["chat"]) 
    def chat(req: ChatRequest) -> ChatResponse:
        try:
            chatbot = app.state.chatbot

            # Optional per-request model override
            if req.model and req.model != app.state.model:
                chatbot.model = req.model
                app.state.model = req.model

            # Update session context
            session_id = req.session_id or "default"
            ctx = app.state.session_context.get(session_id, {})
            if req.selections:
                # merge selections into session context
                ctx.setdefault("selections", {}).update(req.selections)
            app.state.session_context[session_id] = ctx

            # Handle message generation differently
            print(f"DEBUG: message_generation flag: {req.message_generation} (type: {type(req.message_generation)})")
            print(f"DEBUG: query: {req.query}")
            if req.message_generation == True or req.message_generation == "true" or str(req.message_generation).lower() == "true":
                # For message generation, use a simple prompt without RAG
                print("DEBUG: Using generate_message method")
                result = chatbot.generate_message(req.query)
            else:
                print("DEBUG: Using regular chat method")
                # Build a brief user context string for the model
                user_ctx_str = None
                if ctx.get("selections"):
                    import json as _json
                    user_ctx_str = _json.dumps({"selections": ctx["selections"]}, ensure_ascii=False)

                result = chatbot.chat(req.query, max_context_chunks=req.max_context_chunks, user_context=user_ctx_str)

            return ChatResponse(**result)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    return app


app = create_app()


if __name__ == "__main__":
    # Simple CLI to run the server directly: python rag_api.py
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes"}

    uvicorn.run("server:app", host=host, port=port, reload=reload)


