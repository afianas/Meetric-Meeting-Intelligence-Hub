from fastapi import APIRouter
from app.services.storage_service import get_all_meetings

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