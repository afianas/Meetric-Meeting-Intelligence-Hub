from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def call_llm(prompt: str):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant."},
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
