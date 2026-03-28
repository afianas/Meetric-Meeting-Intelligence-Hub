from fastapi import APIRouter
from app.services.embedding_service import get_embedding
from app.services.vector_service import search_vector
from app.services.storage_service import get_meeting_by_id
from app.services.chat_service import generate_answer
from app.services.chat_service import client  # reuse Groq client

router = APIRouter()


@router.get("/chat")
def chat(query: str):
    # 🔢 Step 1: Embed query
    query_embedding = get_embedding(query)

    # 🔍 Step 2: Retrieve top 5 using FAISS
    ids = search_vector(query_embedding, top_k=5)

    if not ids:
        return {
            "query": query,
            "answer": "No relevant meetings found",
            "confidence": 0.1,
            "sources": []
        }

    meetings = [get_meeting_by_id(i) for i in ids if i]

    # 🔥 Step 3: RERANK using LLM
    ranking_text = ""
    for i, m in enumerate(meetings):
        ranking_text += f"{i}: {m['analysis']}\n"

    ranking_prompt = f"""
Select the 2 most relevant meetings for the query.

Query: {query}

Meetings:
{ranking_text}

Return ONLY a Python list like: [0,2]
"""

    ranking_response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": ranking_prompt}]
    )

    try:
        indices = eval(ranking_response.choices[0].message.content)
    except:
        indices = [0, 1]

    selected_meetings = [meetings[i] for i in indices if i < len(meetings)]

    # 🧠 Step 4: Build structured context
    context = ""

    for idx, m in enumerate(selected_meetings, start=1):
        analysis = m.get("analysis", {})

        context += f"Meeting {idx} (ID: {m['_id']}):\n"

        decisions = analysis.get("decisions", [])
        if decisions:
            context += "Decisions:\n"
            for d in decisions:
                context += f"- {d}\n"

        action_items = analysis.get("action_items", [])
        if action_items:
            context += "Action Items:\n"
            for a in action_items:
                context += f"- {a.get('who')} → {a.get('task')} (Deadline: {a.get('deadline')})\n"

        context += "\n"

    # 🤖 Step 5: Generate answer
    answer = generate_answer(query, context)

    return {
        "query": query,
        "answer": answer,
        "confidence": 0.85,
        "sources": [m["_id"] for m in selected_meetings]
    }