from fastapi import APIRouter

from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_meeting_by_id
from app.services.reranker_service import rerank
from app.services.chat_service import generate_answer

router = APIRouter()


@router.get("/chat")
def chat(query: str):
    # 🔢 Step 1: Convert query to embedding
    query_embedding = get_embedding(query)

    # 🔍 Step 2: Retrieve top 5 using FAISS
    ids = search_vector(query_embedding, top_k=10)

    # 🛑 If no results
    if not ids:
        return {
            "query": query,
            "answer": "No relevant meetings found",
            "confidence": 0.1,
            "sources": []
        }

    # 📂 Step 3: Fetch meetings from DB
    meetings = [get_meeting_by_id(i) for i in ids if i]

    # 🔥 Step 4: Rerank using BGE cross-encoder
    selected_meetings = rerank(query, meetings)

    # 🧠 Step 5: Build structured context
    context = ""

    for idx, m in enumerate(selected_meetings, start=1):
        analysis = m.get("analysis", {})

        context += f"Meeting {idx} (ID: {m['_id']}):\n"

        # Decisions
        decisions = analysis.get("decisions", [])
        if decisions:
            context += "Decisions:\n"
            for d in decisions:
                context += f"- {d}\n"

        # Action Items
        action_items = analysis.get("action_items", [])
        if action_items:
            context += "Action Items:\n"
            for a in action_items:
                context += f"- {a.get('who')} → {a.get('task')} (Deadline: {a.get('deadline')})\n"

        # Sentiment (if exists)
        sentiment = analysis.get("sentiment")
        score = analysis.get("sentiment_score")

        if sentiment:
            context += f"Sentiment: {sentiment}"
            if score:
                context += f" (confidence: {score})"
            context += "\n"

        context += "\n"

    # 🤖 Step 6: Generate answer using LLM
    answer = generate_answer(query, context)

    return {
        "query": query,
        "answer": answer,
        "confidence": 0.85,
        "sources": [m["_id"] for m in selected_meetings]
    }
