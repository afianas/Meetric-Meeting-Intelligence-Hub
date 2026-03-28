from transformers import pipeline

# Load lightweight emotion model
emotion_pipeline = pipeline(
    "text-classification",
    model="bhadresh-savani/distilbert-base-uncased-emotion",
    top_k=1
)


def map_emotion(label):
    label = label.lower()

    # Map model outputs → your UI categories
    if label in ["joy", "love", "surprise"]:
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
    results = emotion_pipeline(text[:512])

    if not results:
        return {
            "emotion": "neutral",
            "confidence": 0.0,
            "emotion_raw": "neutral"
        }

    # 🔥 Handle nested list safely
    if isinstance(results[0], list):
        top = results[0][0]
    else:
        top = results[0]

    label = top.get("label", "neutral")
    score = top.get("score", 0.0)

    mapped = map_emotion(label)

    return {
        "emotion_raw": label,
        "emotion": mapped,
        "confidence": round(score, 3)
    }