import logging
import math
from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_all_meeting_titles_and_ids
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer, classify_query, estimate_tokens

logger = logging.getLogger("app.chat_route")

router = APIRouter()


# Constants for RAG Tuning
RELEVANCE_THRESHOLD = 0.0
CONTEXT_TOKEN_BUDGET = 1200

def normalize_text(text: str) -> str:
    """Normalize text for deduplication."""
    return " ".join(text.lower().split())

def stable_sigmoid(x: float) -> float:
    """
    Numerically stable sigmoid function to prevent overflow for large logits.
    Maps raw Reranker scores (-inf, +inf) to confidence probabilities (0, 1).
    """
    try:
        if x >= 0:
            z = math.exp(-x)
            return 1 / (1 + z)
        else:
            z = math.exp(x)
            return z / (1 + z)
    except OverflowError:
        return 1.0 if x > 0 else 0.0
    except Exception:
        return 0.0

def build_context(segments: List[Dict[str, Any]]) -> str:
    """Builds structured context for the LLM with metadata headers."""
    parts = []
    for seg in segments:
        m_title = seg.get("meeting_title") or "Unnamed Meeting"
        speaker = seg.get("speaker") or "Unknown"
        role = seg.get("role") or "Participant"
        parts.append(f"[Meeting: {m_title}] [Speaker: {speaker} ({role})]\n{seg.get('text', '')}")
    return "\n\n".join(parts)


@router.get("/chat")
def chat(query: str, meeting_id: str = None):
    try:
        # Step 1: Detect Mode (LLM-based classification)
        mode = classify_query(query) if not meeting_id else "focused"
        
        # Adaptive retrieval depth
        top_k = 100 if mode != "focused" else 15
        
        # Step 2: Embed Query
        query_embedding = get_embedding(query)

        # Step 3: Retrieve from Pinecone (prod namespace)
        matches = search_vector(query_embedding, meeting_id=meeting_id, top_k=top_k)
        if not matches:
            return {
                "query": query,
                "answer": "No relevant information found in meetings.",
                "confidence": 0.0,
                "sources": [],
                "meetings_used": 0
            }

        # Step 4: Deduplicate (Near-Identical Text)
        seen_hashes = set()
        unique_segments = []
        for match in matches:
            meta = match["metadata"]
            norm_text = normalize_text(meta.get("text", ""))
            if norm_text and norm_text not in seen_hashes:
                seen_hashes.add(norm_text)
                unique_segments.append(meta)

        # Step 5: High-Precision Reranking (BGE)
        reranked = rerank(query, unique_segments)

        # Step 6: Relevance Thresholding (0.2)
        filtered = [(score, seg) for score, seg in reranked if score >= RELEVANCE_THRESHOLD]
        
        if not filtered:
            logger.info(f"⚠️ Query '{query}' failed relevance threshold (best score: {reranked[0][0] if reranked else 'N/A'})")
            return {
                "query": query,
                "answer": "No information sufficiently relevant to your question was found.",
                "confidence": 0.1,
                "sources": [],
                "meetings_used": 0
            }

        if len(filtered) < 2:
            logger.warning(f"Low-confidence retrieval (only {len(filtered)} chunk passed threshold)")

        # Step 7: Diversity Sampling (Multi-meeting selection)
        final_selection = []
        if mode != "focused":
            # Group by meeting_id
            by_meeting = {}
            for score, seg in filtered:
                mid = seg.get("meeting_id")
                if mid not in by_meeting: by_meeting[mid] = []
                by_meeting[mid].append((score, seg))
            
            # Pick top from each
            for mid in list(by_meeting.keys()):
                final_selection.append(by_meeting[mid].pop(0))
            
            # Sort remaining
            remaining = []
            for mid in by_meeting: remaining.extend(by_meeting[mid])
            remaining.sort(key=lambda x: x[0], reverse=True)
            
            # Fill budget
            token_count = sum(estimate_tokens(s[1].get("text", "")) for s in final_selection)
            for score, seg in remaining:
                tokens = estimate_tokens(seg.get("text", ""))
                if token_count + tokens > CONTEXT_TOKEN_BUDGET: break
                final_selection.append((score, seg))
                token_count += tokens
        else:
            # Focused - just token truncation
            token_count = 0
            for score, seg in filtered:
                tokens = estimate_tokens(seg.get("text", ""))
                if token_count + tokens > CONTEXT_TOKEN_BUDGET: break
                final_selection.append((score, seg))
                token_count += tokens

        final_segments = [s[1] for s in final_selection]
        meeting_ids_used = set(s.get("meeting_id") for s in final_segments)

        # Step 8: Context Building & Answer Generation
        context = build_context(final_segments)
        # Log metadata only for privacy
        logger.info(f"✨ Generating answer using {len(final_segments)} segments from {len(meeting_ids_used)} meetings.")
        
        answer = generate_answer(query, context, mode=mode, meetings_used=len(meeting_ids_used))

        # Step 9: Format Rich Response
        rich_sources = []
        for seg in final_segments:
            rich_sources.append({
                "segment_id": seg.get("segment_id", "unknown"),
                "meeting_id": seg.get("meeting_id", "unknown"),
                "meeting_title": seg.get("meeting_title", "Unnamed Meeting"),
                "speaker": seg.get("speaker", "Unknown"),
                "role": seg.get("role", "Participant"),
                "text": seg.get("text", "")[:300],
                "emotion": seg.get("emotion", "neutral")
            })

        # Step 9: Final Response with Normalized Confidence
        # Use top reranked raw score for confidence (even if it's below threshold, 
        # though it won't be here since we filtered).
        top_logit = final_selection[0][0] if final_selection else 0.0
        confidence = round(stable_sigmoid(top_logit), 3) if final_selection else 0.0

        return {
            "query": str(query),
            "answer": str(answer),
            "confidence": confidence,
            "sources": rich_sources,
            "meetings_used": len(meeting_ids_used)
        }

    except Exception as e:
        logger.error(f"🚨 Chat endpoint failure: {e}")
        return {
            "query": query,
            "answer": "Sorry, I encountered a system error. Please try again or contact support.",
            "confidence": 0.0,
            "sources": [],
            "meetings_used": 0
        }
