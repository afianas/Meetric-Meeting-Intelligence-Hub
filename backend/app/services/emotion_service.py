import logging
from app.utils.hf_utils import query_hf_api, is_valid_hf_response

logger = logging.getLogger("app.emotion_service")
# Using the BERT version as the DistilBERT version is deprecated (410 Gone).
EMOTION_MODEL = "bhadresh-savani/bert-base-uncased-emotion"

def map_emotion(label):
    label = label.lower()
    # Map model outputs → your UI categories (Domain-Specific Normalization)
    if label in ["joy", "love"]:
        return "agreement"
    elif label in ["fear", "sadness"]:
        return "concern"
    elif label in ["anger"]:
        return "conflict"
    elif label in ["surprise"]:
        return "uncertainty"
    else:
        return "neutral"

def analyze_emotion(text: str):
    """
    Analyze the emotion of the given text using Hugging Face Inference API.
    """
    if not text.strip():
        return {"emotion": "neutral", "confidence": 0.0, "emotion_raw": "neutral"}

    payload = {"inputs": text[:512]} # Keep input within model limits
    results = query_hf_api(EMOTION_MODEL, payload, task_type="text_classification")

    if not is_valid_hf_response(results):
        return {
            "emotion": "neutral",
            "confidence": 0.0,
            "emotion_raw": "neutral"
        }

    # InferenceClient returns a list of dicts for text classification
    # results = [{'label': 'joy', 'score': 0.99}, ...]
    if isinstance(results, list) and len(results) > 0:
        # Sort by score just in case, though the API usually sorts them
        sorted_results = sorted(results, key=lambda x: x.get("score", 0.0), reverse=True)
        top = sorted_results[0]
    else:
        top = {"label": "neutral", "score": 0.0}

    label = top.get("label", "neutral")
    score = top.get("score", 0.0)


    mapped = map_emotion(label)

    return {
        "emotion_raw": label,
        "emotion": mapped,
        "confidence": round(score, 3)
    }