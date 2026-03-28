import json
from app.services.chat_service import call_llm
    
def segment_transcript(text: str):
    prompt = f"""
You are an expert meeting transcript analyzer.

Your task is to:
1. Split the transcript into speaker turns
2. Infer speaker names, if not possible go to next step.
3. If names are not explicitly mentioned, create labels like:
   "Speaker 1", "Speaker 2", etc.
4. Infer roles if possible (e.g., Developer, Manager, QA)

IMPORTANT RULES:
- DO NOT assign "Unknown" unless absolutely impossible
- Maintain consistent speaker naming throughout
- Keep each segment meaningful (not too small)

Return ONLY valid JSON in this format:

[
  {{
    "speaker": "Speaker 1",
    "role": "Developer",
    "text": "We should fix the backend"
  }}
]

Transcript:
{text}
"""

    response = call_llm(prompt)

    try:
        return json.loads(response)
    except:
        return []