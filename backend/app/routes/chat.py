from fastapi import APIRouter
import math

from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_segments_by_ids
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer

router = APIRouter()


@router.get("/chat")
def chat(query: str):
    # Step 1: Embed query
    query_embedding = get_embedding(query)

    # Step 2: FAISS search (segments)
    segment_ids = search_vector(query_embedding, top_k=10)

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

    # Step 7: Confidence
    if scores:
        mean_logit = sum(scores) / len(scores)
        mean_logit = max(min(mean_logit, 100), -100) # clip to prevent overflow
        confidence = float(round(1 / (1 + math.exp(-mean_logit)), 3))
    else:
        confidence = 0.1

    # Step 8: Build rich sources (meeting_id, speaker, text snippet, emotion)
    # Deduplicate by meeting_id to count unique meetings
    meeting_ids_seen = set()
    rich_sources = []
    for seg in selected_segments:
        meeting_id = seg.get("meeting_id", "unknown")
        meeting_ids_seen.add(meeting_id)
        rich_sources.append({
            "segment_id": seg.get("segment_id", ""),
            "meeting_id": meeting_id,
            "speaker": seg.get("speaker", "Unknown"),
            "role": seg.get("role", ""),
            "text": (seg.get("text", ""))[:300],   # trim to 300 chars for UI
            "emotion": seg.get("emotion", "neutral"),
        })

    return {
        "query": str(query),
        "answer": str(answer),
        "confidence": confidence,
        "sources": rich_sources,
        "meetings_used": len(meeting_ids_seen)
    }