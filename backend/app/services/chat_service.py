from groq import Groq
import os
import logging
from functools import lru_cache

logger = logging.getLogger("app.chat_service")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def call_llm(prompt: str, system_instruction: str = None, model: str = "llama-3.3-70b-versatile"):
    try:
        if not system_instruction:
            system_instruction = (
                "You are a professional meeting intelligence assistant. Your expertise is based strictly on the provided transcript context. "
                "If the query cannot be answered using the provided context, please state that the information was not found in the transcripts. "
                "Maintain a helpful, analytical tone."
            )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"❌ LLM Call Failed: {e}")
        return "I encountered an error while generating an answer. Please try again."


@lru_cache(maxsize=100)
def classify_query(query: str) -> str:
    """Classifies user intent for adaptive retrieval using LLM."""
    prompt = f"""
    Classify the following user query into exactly one of these categories:
    - FOCUSED: Specific question about one meeting (e.g., "What did Sarah say in the sync?")
    - GLOBAL: Question requiring cross-meeting synthesis (e.g., "What are common patterns across all project meetings?")
    - SUMMARY: General request for a recap (e.g., "Summarize my recent meetings")

    Query: "{query}"

    Answer only with the category name (FOCUSED, GLOBAL, or SUMMARY).
    """
    
    try:
        # Use a faster model if possible, or just the same one
        res = call_llm(prompt, system_instruction="You are a query classifier. Answer only with one word.", model="llama-3.1-8b-instant")
        category = res.strip().upper()
        if category in ["FOCUSED", "GLOBAL", "SUMMARY"]:
            return category.lower()
        return "focused"
    except:
        return "focused"


def estimate_tokens(text: str) -> int:
    """Heuristic token estimation (char_count // 4)."""
    return len(text) // 4


def generate_answer(query: str, context: str, mode: str = "focused", meetings_used: int = 1):
    system_instruction = (
        "You are a professional meeting intelligence assistant. Your expertise is based strictly on the provided transcript context. "
        "If the query cannot be answered using the provided context, please state that the information was not found in the transcripts. "
        "Maintain a helpful, analytical tone and avoid hallucinating details outside the provided text. "
        "IMPORTANT: DO NOT use Markdown formatting (like ** for bold or # for headers). Use plain text only for readability in a non-markdown UI."
    )
    
    if mode == "global" and meetings_used > 1:
        system_instruction += (
            " IMPORTANT: You are currently analyzing MULTIPLE meetings. Identify patterns, similarities, and differences across the meetings provided in the context. "
            "Be sure to acknowledge the breadth of the workspace data in your synthesis."
        )

    prompt = f"""
You are a meeting assistant.

Answer the user's question based ONLY on the context below.

Context:
{context}

Question:
{query}
"""

    return call_llm(prompt, system_instruction=system_instruction)
