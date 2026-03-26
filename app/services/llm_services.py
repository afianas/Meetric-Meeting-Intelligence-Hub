from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_action_items(text):
    prompt = f"""
    Extract decisions and action items from the following meeting transcript.

    Return JSON with:
    - decisions
    - action_items (who, what, deadline)

    Transcript:
    {text}
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content