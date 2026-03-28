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

        decisions = analysis.get("decisions", [])
        action_items = analysis.get("action_items", [])

        combined_text = " ".join(decisions) + " " + " ".join(
            [item.get("task", "") for item in action_items]
        )

        if query.lower() in combined_text.lower():
            results.append(meeting)

    return {
        "query": query,
        "results": results
    }


# 🔥 Semantic Search (FINAL CLEAN VERSION)
@router.get("/semantic-search")
def semantic_search(query: str, top_k: int = 3):
    meetings = get_all_meetings()

    query_embedding = np.array(get_embedding(query))

    results = []

    for meeting in meetings:
        emb = meeting.get("embedding")

        # 🚫 Skip if no embedding
        if not emb:
            continue

        emb = np.array(emb)

        # 🧮 Cosine similarity
        similarity = np.dot(query_embedding, emb) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(emb)
        )

        # ✅ Clean result object (BEST PRACTICE)
        result_item = {
            "_id": str(meeting["_id"]),
            "analysis": meeting.get("analysis", {}),
            "_score": round(float(similarity), 3),
            "match_reason": "Matched based on semantic similarity"
        }

        results.append(result_item)

    # 🔽 Sort results
    results.sort(key=lambda x: x["_score"], reverse=True)

    return {
        "query": query,
        "top_k": top_k,
        "results": results[:top_k]
    }