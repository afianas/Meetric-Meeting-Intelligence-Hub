import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
load_dotenv('backend/.env')

try:
    from app.services.embedding_service import get_embedding
    from app.services.emotion_service import analyze_emotion

    print("--- 🧪 Final HF Migration Test ---")
    
    # Test Embedding
    emb = get_embedding("Hugging Face Inference API is great!")
    if emb and len(emb) > 0:
        print(f"✅ Embeddings: Success (Vector Size: {len(emb)})")
    else:
        print("❌ Embeddings: Failed")

    # Test Emotion
    emo = analyze_emotion("This meeting was very productive, I'm happy with the results.")
    if emo and emo.get("emotion") != "neutral":
        print(f"✅ Emotions: Success (Detected: {emo['emotion']}, Score: {emo['confidence']})")
    else:
        print(f"❌ Emotions: Failed or Neutral (Result: {emo})")

except Exception as e:
    print(f"❌ System Error: {e}")
