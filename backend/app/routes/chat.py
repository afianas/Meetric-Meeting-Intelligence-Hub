from fastapi import APIRouter

from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_segments_by_ids
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer

router = APIRouter()


@router.get("/chat")
def chat(query: str):
    # 🔹 Step 1: Embed query
    query_embedding = get_embedding(query)

    # 🔹 Step 2: FAISS search (segments)
    segment_ids = search_vector(query_embedding, top_k=10)

    if not segment_ids:
        return {
            "query": query,
            "answer": "No relevant information found",
            "confidence": 0.1,
            "sources": []
        }

    # 🔹 Step 3: Fetch segments
    segments = get_segments_by_ids(segment_ids)

    # 🔹 Step 4: Rerank
    ranked = rerank(query, segments)

    scores = [float(score) for score, _ in ranked]
    selected_segments = [seg for _, seg in ranked]

    # 🔹 Step 5: Build context
    context_parts = []

    for seg in selected_segments:
        part = f"""
Speaker: {seg.get('speaker')} ({seg.get('role')})
Text: {seg.get('text')}
Emotion: {seg.get('emotion')}
"""
        context_parts.append(part)

    context = "\n".join(context_parts)

    # 🔹 Step 6: LLM answer
    answer = generate_answer(query, context)

    # 🔹 Step 7: Confidence
    if scores:
        confidence = float(round(sum(scores) / len(scores), 3))
    else:
        confidence = 0.1

    return {
        "query": str(query),
        "answer": str(answer),
        "confidence": confidence,
        "sources": [seg["segment_id"] for seg in selected_segments]
    }