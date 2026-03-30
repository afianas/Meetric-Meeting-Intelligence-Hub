from fastapi import APIRouter
import math

from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_segments_by_ids
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer

router = APIRouter()


@router.get("/chat")
def chat(query: str, meeting_id: str = None):
    # Step 1: Embed query
    query_embedding = get_embedding(query)

    # Step 2: FAISS search (segments) - now supports optional meeting scoping
    segment_ids = search_vector(query_embedding, meeting_id=meeting_id, top_k=10)

    if not segment_ids:
        return {
            "query": query,
            "answer": "No relevant information found in meetings",
            "confidence": 0.0,
            "sources": [],
            "meetings_used": 0
        }

    # Step 3: Fetch segments (now includes meeting_id via storage_service)
    segments = get_segments_by_ids(segment_ids)

    # Step 4: Rerank
    ranked = rerank(query, segments)

    scores = [float(score) for score, _ in ranked]
    selected_segments = [seg for _, seg in ranked]

    # Step 5: Build context
    context_parts = []
    for seg in selected_segments:
        part = f"""
Speaker: {seg.get('speaker')} ({seg.get('role')})
Text: {seg.get('text')}
Emotion: {seg.get('emotion')}
"""
        context_parts.append(part)

    context = "\n".join(context_parts)

    # Step 6: LLM answer
    answer = generate_answer(query, context)

    # Step 7: Confidence (Sigmoid with humanized floor)
    if scores:
        mean_logit = sum(scores) / len(scores)
        mean_logit = max(min(mean_logit, 100), -100)
        prob = 1 / (1 + math.exp(-mean_logit))
        confidence = float(max(prob, 0.05))
    else:
        confidence = 0.0

    # Step 8: Build rich sources (defensive field checks)
    rich_sources = []
    seen_texts = set()
    meeting_ids_seen = set()
    for seg in selected_segments:
        # Check multiple possible text fields for robustness
        snippet = seg.get("text") or seg.get("content") or seg.get("message") or ""
        snippet = snippet.strip()
        
        # Deduplicate identical snippets for cleaner reporting
        if not snippet or snippet in seen_texts:
            continue
        seen_texts.add(snippet)

        rich_sources.append({
            "segment_id": seg.get("segment_id", "unknown"),
            "meeting_id": seg.get("meeting_id", "unknown"),
            "speaker": seg.get("speaker", "Unknown"),
            "role": seg.get("role", ""),
            "text": snippet[:300],
            "emotion": seg.get("emotion", "neutral")
        })
        meeting_ids_seen.add(seg.get("meeting_id", "unknown"))

    # If we found sources but confidence ended up 0, force a 5% floor
    if rich_sources and confidence < 0.05:
        confidence = 0.05

    return {
        "query": str(query),
        "answer": str(answer),
        "confidence": confidence,
        "sources": rich_sources,
        "meetings_used": len(meeting_ids_seen)
    }