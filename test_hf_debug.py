import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')
key = os.getenv('HUGGING_FACE_API_KEY')
model = 'bhadresh-savani/bert-base-uncased-emotion'
url = f'https://api-inference.huggingface.co/models/{model}'

print(f"Using Token: {key[:10]}...")
print(f"Targeting Model: {model}")

res = requests.post(
    url, 
    headers={'Authorization': f'Bearer {key}'}, 
    json={'inputs': 'I am happy'}
)

print(f"Status: {res.status_code}")
print(f"Body: {res.text}")
