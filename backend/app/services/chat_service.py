from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_answer(query, context):
    prompt = f"""
You are an intelligent assistant analyzing meeting data.

Context:
{context}

Question:
{query}

Instructions:
- Answer using the provided context only
- Combine insights from multiple meetings if needed
- Be clear and concise
- If partially relevant, still answer
- Do NOT say "Not found" unless absolutely no information exists

Answer:
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
