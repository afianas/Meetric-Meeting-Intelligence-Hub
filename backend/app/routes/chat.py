from fastapi import APIRouter
import math

from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_segments_by_ids
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer

router = APIRouter()


def calibrated_confidence(score: float) -> float:
    # 1. Scaled Sigmoid (mild scaling)
    scaled = score * 1.2
    prob = 1 / (1 + math.exp(-scaled))
    
    # 2. Confidence Stretching (removes mid-range bias)
    # pushes weak matches lower, strong matches higher
    stretched = (prob - 0.3) / 0.7
    conf = min(max(stretched, 0.0), 1.0)
    
    # 3. Hard Thresholding for bad retrieval
    if score < -0.5:
        conf = min(conf, 0.25)
        
    # 4. Floor & Ceiling (UX Stability)
    conf = max(0.05, min(conf, 0.98))
    
    return float(conf)


def detect_query_mode(query: str, meeting_id: str = None) -> str:
    """Detects if a query targets a specific meeting or requires cross-meeting synthesis."""
    if meeting_id:
        return "focused"
    
    query_lc = query.lower()
    
    # Global Keywords/Intents
    global_patterns = [
        "across meetings", "all meetings", "summarize meetings", 
        "trends", "overall", "compare", "similarities", "differences",
        "across all", "every meeting", "workspace-wide"
    ]
    
    if any(p in query_lc for p in global_patterns):
        return "global"
        
    # Heuristic: Plural "meetings" without global keywords usually implies a general search, 
    # but we'll default to focused for precision unless "all" or specific cross-meeting 
    # terms are used.
    return "focused"


def diversity_sample(ranked_results, target_count=15):
    """Ensures multiple meetings are represented in the final context."""
    if not ranked_results:
        return []
        
    # Group reranked segments by meeting_id
    grouped = {}
    for score, seg in ranked_results:
        m_id = seg.get("meeting_id", "unknown")
        if m_id not in grouped:
            grouped[m_id] = []
        grouped[m_id].append((score, seg))
        
    selected = []
    
    # 1st Pass: Pick the single best segment from each unique meeting
    # This guarantees diversity in the foundation of the context
    for m_id in list(grouped.keys()):
        if grouped[m_id]:
            selected.append(grouped[m_id].pop(0))
        
    # 2nd Pass: Fill the remaining slots with the next-best segments globally
    remaining = []
    for m_id in grouped:
        remaining.extend(grouped[m_id])
    
    # Sort by reranker score
    remaining.sort(key=lambda x: x[0], reverse=True)
    
    while len(selected) < target_count and remaining:
        selected.append(remaining.pop(0))
        
    # Restore original score-based ordering for the LLM
    selected.sort(key=lambda x: x[0], reverse=True)
    return selected[:target_count]


@router.get("/chat")
def chat(query: str, meeting_id: str = None):
    # Step 1: Detect Mode & Configure Retrieval
    mode = detect_query_mode(query, meeting_id)
    
    # Adaptive configuration
    if mode == "global":
        top_k_candidates = 100
        rerank_n = 40
        target_context_n = 15
    else:
        top_k_candidates = 20
        rerank_n = 10
        target_context_n = 10

    # Step 2: Embed query
    query_embedding = get_embedding(query)

    # Step 3: FAISS search
    segment_ids = search_vector(query_embedding, meeting_id=meeting_id, top_k=top_k_candidates)

    if not segment_ids:
        return {
            "query": query,
            "answer": "No relevant information found in meetings",
            "confidence": 0.0,
            "sources": [],
            "meetings_used": 0
        }

    # Step 4: Fetch segments
    segments = get_segments_by_ids(segment_ids)

    # Step 5: Rerank
    # Pass dynamic rerank_n
    ranked = rerank(query, segments, top_n=rerank_n)

    # Step 6: Diversity Sampling & Safety Fallback
    unique_meeting_ids = set(seg.get("meeting_id") for _, seg in ranked if seg.get("meeting_id"))
    
    if mode == "global" and len(unique_meeting_ids) > 1:
        # Apply diversity sampling to represent multiple meetings
        final_ranked = diversity_sample(ranked, target_count=target_context_n)
    else:
        # Focused mode or single-meeting global fallback
        final_ranked = ranked[:target_context_n]

    scores = [float(score) for score, _ in final_ranked]
    selected_segments = [seg for _, seg in final_ranked]
    final_meetings_used = len(set(seg.get("meeting_id") for seg in selected_segments if seg.get("meeting_id")))

    # Step 7: Build context
    context_parts = []
    for seg in selected_segments:
        m_title = seg.get("meeting_title", "Unnamed Meeting")
        part = f"""
Meeting: {m_title} (ID: {seg.get('meeting_id', 'unknown')})
Speaker: {seg.get('speaker')} ({seg.get('role')})
Text: {seg.get('text')}
Emotion: {seg.get('emotion')}
"""
        context_parts.append(part)

    context = "\n".join(context_parts)

    # Step 8: LLM answer (pass mode and meetings_used for conditioning)
    answer = generate_answer(query, context, mode=mode, meetings_used=final_meetings_used)

    # Step 9: Calibrated Confidence
    if scores:
        top_score = scores[0]
        confidence = calibrated_confidence(top_score)
    else:
        confidence = 0.0

    # Step 10: Build rich sources (defensive field checks)
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
            "meeting_title": seg.get("meeting_title", "Unnamed Meeting"),
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