from fastapi import APIRouter
from app.services.storage_service import get_all_meetings

router = APIRouter()


@router.get("/speaker-analytics")
def speaker_analytics():
    meetings = get_all_meetings()

    speaker_stats = {}

    for meeting in meetings:
        segments = meeting.get("segments", [])

        for seg in segments:
            speaker = seg.get("speaker", "Unknown")
            emotion = seg.get("emotion", "neutral")

            if speaker not in speaker_stats:
                speaker_stats[speaker] = {
                    "total_segments": 0,
                    "emotion_counts": {
                        "agreement": 0,
                        "concern": 0,
                        "conflict": 0,
                        "uncertainty": 0,
                        "neutral": 0
                    }
                }

            speaker_stats[speaker]["total_segments"] += 1
            speaker_stats[speaker]["emotion_counts"][emotion] += 1

    # 🔥 Convert to percentages
    results = []

    for speaker, data in speaker_stats.items():
        total = data["total_segments"]
        emotions = data["emotion_counts"]

        percentages = {
            k: round((v / total) * 100, 2) if total > 0 else 0
            for k, v in emotions.items()
        }

        results.append({
            "speaker": speaker,
            "total_segments": total,
            "emotion_distribution": percentages
        })

    return {
        "speakers": results
    }