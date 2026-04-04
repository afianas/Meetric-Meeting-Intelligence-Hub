import numpy as np
from fastapi import APIRouter

from app.services.storage_service import get_all_meetings
from app.services.embedding_service import get_embedding

router = APIRouter()


# 🔹 Keyword Search
@router.get("/search")
def search_meetings(query: str):
    meetings = get_all_meetings()
    results = []

    for meeting in meetings:
        analysis = meeting.get("analysis", {})
        m_name = analysis.get("meeting_name") or "Untitled Meeting"
        
        decisions = analysis.get("decisions", [])
        action_items = [item.get("task", "") for item in analysis.get("action_items", [])]

        combined_text = f"{m_name} " + " ".join(decisions) + " " + " ".join(action_items)

        if query.lower() in combined_text.lower():
            results.append(meeting)

    return {
        "query": query,
        "results": results
    }



@router.get("/semantic-search")
def semantic_search(query: str, top_k: int = 5):
    """
    Semantic search across meetings using Pinecone.
    Retrieves the most relevant segments and returns their parent meetings.
    """
    try:
        from app.services.embedding_service import get_embedding
        from app.services.vector_service import search_vector
        from app.services.storage_service import collection
        from bson import ObjectId
        import logging

        query_embedding = get_embedding(query)
        
        # Step 1: Query Pinecone for top segments (high recall)
        matches = search_vector(query_embedding, top_k=top_k * 5)
        
        if not matches:
            return {"query": query, "results": []}

        # Step 2: Extract unique meeting IDs and their best scores
        seen_meeting_ids = set()
        results = []
        
        for match in matches:
            m_id = match["metadata"].get("meeting_id")
            if not m_id or m_id in seen_meeting_ids:
                continue
            
            seen_meeting_ids.add(m_id)
            meeting = collection.find_one({"_id": ObjectId(m_id)})
            
            if meeting:
                results.append({
                    "_id": str(meeting["_id"]),
                    "analysis": meeting.get("analysis", {}),
                    "_score": round(float(match["score"]), 3),
                    "match_reason": f"Highly relevant segment found: \"{match['metadata'].get('text', '')[:120]}...\""
                })
            
            if len(results) >= top_k:
                break

        return {
            "query": query,
            "top_k": top_k,
            "results": results
        }
    except Exception as e:
        logging.getLogger("app.search").error(f"Semantic search failed: {e}")
        return {"query": query, "results": [], "error": str(e)}