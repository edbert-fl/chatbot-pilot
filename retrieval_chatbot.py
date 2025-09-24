#!/usr/bin/env python3
"""
Working RAG + OpenAI Chat Integration
Uses existing embeddings without regenerating them.
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")

try:
    from openai import OpenAI
except ImportError:
    print("Error: OpenAI package not installed. Run: pip install openai")
    sys.exit(1)

# Add the rag module to the path
sys.path.append(str(Path(__file__).parent))

from rag.config import RAGConfig
from rag.types import ScoredChunk, SignalScores
from rag.utils import read_json, read_jsonl, tokenize
from rank_bm25 import BM25Okapi


class WorkingRAGChatBot:
    def __init__(self, index_dir: str, api_key: str = None, model: str = "gpt-3.5-turbo"):
        """Initialize the working RAG chatbot."""
        self.index_dir = Path(index_dir)
        self.model = model
        
        # Initialize OpenAI client
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable or pass api_key parameter.")
            self.client = OpenAI(api_key=api_key)
        
        # Load the existing index
        self._load_index()
    
    def _load_index(self):
        """Load the existing RAG index."""
        print("📚 Loading RAG index...")
        
        # Load chunks
        chunks_path = self.index_dir / "meta" / "chunks.jsonl"
        self.chunks = []
        for row in read_jsonl(chunks_path):
            self.chunks.append({
                'chunk_id': row['chunk_id'],
                'document_source_id': row['document_source_id'],
                'document_uri': row['document_uri'],
                'document_type': row['document_type'],
                'content': row['content'],
                'chunk_index': row['chunk_index'],
                'checksum': row['checksum'],
                'extra': row.get('extra', {})
            })
        
        # Load embeddings
        embeddings_path = self.index_dir / "embeddings" / "embeddings.npy"
        if embeddings_path.exists():
            self.embeddings = np.load(embeddings_path)
        else:
            self.embeddings = None
        
        # Load BM25
        bm25_path = self.index_dir / "bm25" / "corpus.json"
        bm25_corpus = read_json(bm25_path)
        tokenized_corpus = [tokenize(doc) for doc in bm25_corpus["documents"]]
        self.bm25 = BM25Okapi(tokenized_corpus)
        self.bm25_chunk_ids = bm25_corpus["chunk_ids"]
        
        print(f"✅ Loaded {len(self.chunks)} chunks, embeddings: {self.embeddings.shape if self.embeddings is not None else 'None'}")
    
    def topk_indices(self, scores: np.ndarray, k: int, largest: bool = True) -> List[int]:
        """Get top-k indices from scores."""
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
    
    def reciprocal_rank_fusion(self, ranks: Dict[str, int], k: int) -> float:
        """Calculate reciprocal rank fusion score."""
        score = 0.0
        for _, r in ranks.items():
            if r is not None:
                score += 1.0 / (k + r)
        return score
    
    def retrieve_context(self, query: str, k_bm25: int = 8, k_vector: int = 8, k_fused: int = 8) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks using the existing index."""
        print(f"🔍 Searching for: '{query}'")
        
        # BM25 search
        bm25_scores = self.bm25.get_scores(tokenize(query))
        bm25_top_idx = self.topk_indices(np.array(bm25_scores), k_bm25, largest=True)
        
        # Vector search (if embeddings available)
        vector_scores = np.array([])
        vector_top_idx = []
        if self.embeddings is not None:
            # For now, we'll skip vector search to avoid embedding generation issues
            # In a real implementation, you'd generate query embeddings here
            pass
        
        # Create rank maps
        bm25_rank_map = {i: rank for rank, i in enumerate(bm25_top_idx)}
        vector_rank_map = {i: rank for rank, i in enumerate(vector_top_idx)}
        
        # Union of candidates
        candidate_idxs = sorted(set(bm25_top_idx) | set(vector_top_idx))
        
        # Fuse rankings
        fused_results = []
        for idx in candidate_idxs:
            bm25_rank = bm25_rank_map.get(idx)
            vec_rank = vector_rank_map.get(idx)
            
            rranks = {}
            if bm25_rank is not None:
                rranks["bm25"] = bm25_rank
            if vec_rank is not None:
                rranks["vector"] = vec_rank
            
            fused_score = self.reciprocal_rank_fusion(rranks, 60)  # RRF k=60
            
            result = {
                'chunk': self.chunks[idx],
                'fused_score': fused_score,
                'bm25_score': float(bm25_scores[idx]) if idx < len(bm25_scores) else None,
                'bm25_rank': (bm25_rank + 1) if bm25_rank is not None else None,
                'vector_score': None,  # Skipped for now
                'vector_rank': None,
            }
            fused_results.append((idx, fused_score, result))
        
        # Sort by fused score and return top-k
        fused_results.sort(key=lambda x: x[1], reverse=True)
        return [result for _, _, result in fused_results[:k_fused]]
    
    def format_context_for_llm(self, chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into context for the LLM."""
        if not chunks:
            return "No relevant information found."
        
        context_blocks = []
        
        for i, chunk_data in enumerate(chunks, 1):
            chunk = chunk_data['chunk']
            source_title = chunk['extra'].get("source_title", "Unknown")
            chunk_index = chunk['chunk_index']
            checksum = chunk['checksum'][:8]
            
            bm25_score_str = f"{chunk_data['bm25_score']:.3f}" if chunk_data['bm25_score'] is not None else 'N/A'
            vector_score_str = f"{chunk_data['vector_score']:.3f}" if chunk_data['vector_score'] is not None else 'N/A'
            
            context_block = f"""[{i}] {source_title} — chunk #{chunk_index}
   checksum: {checksum}
   bm25_score: {bm25_score_str}
   vector_score: {vector_score_str}
   content: {chunk['content'][:500]}{'...' if len(chunk['content']) > 500 else ''}"""
            
            context_blocks.append(context_block)
        
        return "\n\n".join(context_blocks)
    
    def create_prompt(self, query: str, context: str, user_context: str | None = None) -> str:
        """Create the prompt for the LLM with context, optional user context, and instructions."""
        extra_user_ctx = f"\nUser Context (from previous selections or profile):\n{user_context}\n" if user_context else "\n"
        return f"""You are a Josh, a sales assistant for an AI Software Development Company. Answer the user's question using ONLY the information about the company and the products provided in the context below. 

IMPORTANT RULES:
- Base your answer strictly on the provided context if the question is related to the context.
- If the context doesn't contain enough information to answer, say "That's a good question, I'm not sure about that. I'm going to reach out to my team to get more information."
- Use inline citations like [1], [2] to reference specific sources
- Be precise and factual, but also be engaging and friendly.
- If you see conflicting information, mention the discrepancy
- Try to keep the conversation flow natural and engaging and focused on the topic of whether the company should use the AI Software Development Company.

Question: {query}

Context:
{context}

{extra_user_ctx}
Instructions:
- Synthesize a concise answer (2-4 sentences unless more detail is requested)
- Use exact figures, timelines, and policies from the context
- Add inline citations [1], [2], etc. where you make claims
- End your response with a "Sources" section listing the referenced citations
 - If the user's query matches a known step in our user flows (see indexed samples/user_flows.md), append a suitable UI tag on a new line at the end of your answer, using square brackets (e.g., [contact_form], [button_group_what_chatbot], [button_group_channels], [button_group_audience], [book_demo]). Do not include more than one tag per answer.

Answer:"""
    
    def chat(self, query: str, max_context_chunks: int = 5, user_context: str | None = None) -> Dict[str, Any]:
        """Process a query using RAG + OpenAI with optional user context for personalization."""
        # Retrieve relevant chunks
        chunks = self.retrieve_context(query)
        
        if not chunks:
            return {
                "answer": "I couldn't find any relevant information in the available documents.",
                "citations": [],
                "retrieval_metadata": {
                    "query": query,
                    "chunks_found": 0,
                    "retrieval_method": "bm25_only"
                }
            }
        
        # Limit context to top chunks
        context_chunks = chunks[:max_context_chunks]
        
        # Format context for LLM
        context = self.format_context_for_llm(context_chunks)
        
        # Create prompt
        prompt = self.create_prompt(query, context, user_context=user_context)
        
        print(f"📝 Generating answer using {len(context_chunks)} relevant sources...")
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a Josh, a friendly sales assistant for an AI Software Development Company that provides accurate, cited answers based on what you know from provided documents."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.1  # Low temperature for factual responses
            )
            
            answer = response.choices[0].message.content
            
            # Extract citations from answer
            citations = []
            for chunk_data in context_chunks:
                chunk = chunk_data['chunk']
                source_title = chunk['extra'].get("source_title", "Unknown")
                citations.append({
                    "source_title": source_title,
                    "document_uri": chunk['document_uri'],
                    "chunk_index": chunk['chunk_index'],
                    "checksum": chunk['checksum'],
                    "bm25_score": chunk_data['bm25_score'],
                    "vector_score": chunk_data['vector_score'],
                    "fused_score": chunk_data['fused_score'],
                    "snippet": chunk['content'][:200] + "..." if len(chunk['content']) > 200 else chunk['content']
                })
            
            return {
                "answer": answer,
                "citations": citations,
                "retrieval_metadata": {
                    "query": query,
                    "chunks_found": len(chunks),
                    "chunks_used": len(context_chunks),
                    "retrieval_method": "bm25_only",
                    "model_used": self.model
                }
            }
            
        except Exception as e:
            return {
                "answer": f"Error generating response: {str(e)}",
                "citations": [],
                "retrieval_metadata": {
                    "query": query,
                    "error": str(e)
                }
            }
    
    def interactive_chat(self):
        """Start an interactive chat session."""
        print("🤖 Working RAG + OpenAI Chatbot")
        print("=" * 50)
        print("Ask questions about the bank policies. Type 'quit' to exit.")
        print()
        
        while True:
            try:
                query = input("❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not query:
                    continue
                
                print()
                result = self.chat(query)
                
                print(f"🤖 Answer: {result['answer']}")
                print()
                
                if result['citations']:
                    print("📚 Sources:")
                    for i, citation in enumerate(result['citations'], 1):
                        print(f"  [{i}] {citation['source_title']} (chunk #{citation['chunk_index']})")
                        print(f"      Score: {citation['fused_score']:.3f} | {citation['snippet']}")
                        print()
                
                print("-" * 50)
                print()
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                print()


def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Working RAG + OpenAI Chatbot")
    parser.add_argument("--index-dir", default="./local_index", help="Path to RAG index directory")
    parser.add_argument("--model", default="gpt-3.5-turbo", help="OpenAI model to use")
    parser.add_argument("--query", help="Single query to process (non-interactive)")
    parser.add_argument("--api-key", help="OpenAI API key (or set OPENAI_API_KEY env var)")
    
    args = parser.parse_args()
    
    chatbot = WorkingRAGChatBot(
        index_dir=args.index_dir,
        api_key=args.api_key,
        model=args.model
    )
    
    if args.query:
        # Single query mode
        result = chatbot.chat(args.query)
        print("🤖 Answer:", result['answer'])
        if result['citations']:
            print("\n📚 Sources:")
            for i, citation in enumerate(result['citations'], 1):
                print(f"  [{i}] {citation['source_title']} (chunk #{citation['chunk_index']})")
    else:
        # Interactive mode
        chatbot.interactive_chat()


if __name__ == "__main__":
    main()
