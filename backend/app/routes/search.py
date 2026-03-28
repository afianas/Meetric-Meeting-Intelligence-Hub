import numpy as np
from fastapi import APIRouter
from app.services.storage_service import get_all_meetings
from app.services.embedding_service import get_embedding

router = APIRouter()


@router.get("/search")
def search_meetings(query: str):
    meetings = get_all_meetings()

    results = []

    for meeting in meetings:
        analysis = meeting.get("analysis", {})

        decisions = analysis.get("decisions", [])
        action_items = analysis.get("action_items", [])

        # Combine all searchable text
        combined_text = " ".join(decisions) + " " + " ".join(
            [item.get("task", "") for item in action_items]
        )

        if query.lower() in combined_text.lower():
            results.append(meeting)

    return {
        "query": query,
        "results": results
    }

@router.get("/semantic-search")
def semantic_search(query: str):
    meetings = get_all_meetings()

    query_embedding = np.array(get_embedding(query))

    results = []

    for meeting in meetings:
        emb = np.array(meeting.get("embedding", []))

        if len(emb) == 0:
            continue

        # cosine similarity
        similarity = np.dot(query_embedding, emb) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(emb)
        )

        results.append((similarity, meeting))

    results.sort(reverse=True, key=lambda x: x[0])

    top_results = [r[1] for r in results[:3]]

    return {
        "query": query,
        "results": top_results
    }