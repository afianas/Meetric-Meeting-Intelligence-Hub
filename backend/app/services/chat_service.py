from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def call_llm(prompt: str):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system", 
                "content": "You are a professional meeting intelligence assistant. Your expertise is based strictly on the provided transcript context. "
                           "If the query cannot be answered using the provided context, please state that the information was not found in the transcripts. "
                           "Maintain a helpful, analytical tone and avoid hallucinating details outside the provided text."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content


def generate_answer(query: str, context: str):
    prompt = f"""
You are a meeting assistant.

Answer the user's question based ONLY on the context below.

Context:
{context}

Question:
{query}
"""

    return call_llm(prompt)
