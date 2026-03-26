from groq import Groq
from app.utils.config import GROQ_API_KEY
import json

client = Groq(api_key=GROQ_API_KEY)

def extract_action_items(text: str):
    prompt = f"""
You are an expert AI assistant that extracts structured insights from meeting transcripts.

Your task is to analyze the transcript and extract:

1. Decisions made during the meeting
2. Action items with:
   - id (start from 1 and increment)
   - who (person responsible; if unclear, write "Unassigned")
   - task (clear, concise, professional wording)
   - deadline (if mentioned, else null)

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON
- DO NOT include markdown
- DO NOT include explanations
- Ensure valid JSON

OUTPUT FORMAT:
{{
  "decisions": [
    "Decision 1"
  ],
  "action_items": [
    {{
      "id": 1,
      "who": "Person Name",
      "task": "Clear task description",
      "deadline": "Day or null"
    }}
  ]
}}

Now analyze this transcript:

{text}
"""

    response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You ONLY return valid JSON. No markdown. No explanations."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.1
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