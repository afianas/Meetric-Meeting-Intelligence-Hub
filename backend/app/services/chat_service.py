from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def call_llm(prompt: str, system_instruction: str = None):
    if not system_instruction:
        system_instruction = (
            "You are a professional meeting intelligence assistant. Your expertise is based strictly on the provided transcript context. "
            "If the query cannot be answered using the provided context, please state that the information was not found in the transcripts. "
            "Maintain a helpful, analytical tone and avoid hallucinating details outside the provided text."
        )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content


def generate_answer(query: str, context: str, mode: str = "focused", meetings_used: int = 1):
    system_instruction = (
        "You are a professional meeting intelligence assistant. Your expertise is based strictly on the provided transcript context. "
        "If the query cannot be answered using the provided context, please state that the information was not found in the transcripts. "
        "Maintain a helpful, analytical tone and avoid hallucinating details outside the provided text."
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
