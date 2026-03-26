from groq import Groq
from app.utils.config import GROQ_API_KEY
import json

client = Groq(api_key=GROQ_API_KEY)

def extract_action_items(text: str):
    prompt = f"""
You are an AI assistant that extracts structured information from meeting transcripts.

Extract:
1. Decisions made
2. Action items with:
   - who (person responsible)
   - task (what needs to be done)
   - deadline (if mentioned, else null)

IMPORTANT:
- Return ONLY valid JSON
- No explanations
- No extra text

Format:
{{
  "decisions": ["..."],
  "action_items": [
    {{
      "who": "...",
      "task": "...",
      "deadline": "..."
    }}
  ]
}}

Transcript:
{text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    content = response.choices[0].message.content

    # 🔥 Safe JSON parsing
    try:
        return json.loads(content)
    except:
        return {
            "error": "Invalid JSON from model",
            "raw_output": content
        }