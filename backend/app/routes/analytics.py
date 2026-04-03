from fastapi import APIRouter, Query
from typing import Optional
from app.services.storage_service import get_all_meetings, get_meeting

router = APIRouter()


@router.get("/speaker-analytics")
def speaker_analytics(meeting_id: Optional[str] = Query(None)):
    if meeting_id:
        meetings = [get_meeting(meeting_id)]
    else:
        meetings = get_all_meetings()

    speaker_stats = {}

    for meeting in meetings:
        if not meeting: continue
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


@router.get("/sentiment-flow")
def sentiment_flow(meeting_id: Optional[str] = Query(None)):
    if meeting_id:
        meetings = [get_meeting(meeting_id)]
    else:
        meetings = get_all_meetings()

    flow = []
    
    # Linearize all segments chronologically
    for meeting in meetings:
        if not meeting: continue
        segments = meeting.get("segments", [])
        for seg in segments:
            flow.append({
                "segment_id": seg.get("segment_id"),
                "speaker": seg.get("speaker", "Unknown"),
                "emotion": seg.get("emotion", "neutral"),
                "confidence": seg.get("confidence", 0.0),
                "text": seg.get("text", ""),
                "meeting_id": str(meeting.get("_id"))
            })
            
    return {"flow": flow}


@router.get("/sentiment-insight")
def sentiment_insight(meeting_id: Optional[str] = Query(None)):
    if meeting_id:
        meetings = [get_meeting(meeting_id)]
    else:
        meetings = get_all_meetings()

    total_counts = {"agreement": 0, "concern": 0, "conflict": 0, "uncertainty": 0, "neutral": 0}
    total_segments = 0

    for meeting in meetings:
        if not meeting: continue
        for seg in meeting.get("segments", []):
            total_counts[seg.get("emotion", "neutral")] += 1
            total_segments += 1

    if total_segments == 0:
        return {"insight": "No data available."}

    # Dominant sentiment logic (Rule-based 1-line generation)
    top_emotion = max(total_counts, key=total_counts.get)
    conflict_pct = (total_counts["conflict"] / total_segments) * 100
    agreement_pct = (total_counts["agreement"] / total_segments) * 100
    concern_pct = (total_counts["concern"] / total_segments) * 100

    if conflict_pct > 20:
        insight = f"The interaction exhibits high friction ({conflict_pct:.1f}% conflict), suggesting strong disagreements during key discussions."
    elif agreement_pct > 60:
        insight = f"The environment is exceptionally collaborative, with {agreement_pct:.1f}% positive consensus across the dialogue."
    elif concern_pct > 25:
        insight = f"While professional, the conversation is marked by notable caution and risk-assessment ({concern_pct:.1f}% concern)."
    elif top_emotion == "agreement":
        insight = "The conversation remained mostly collaborative with steady progress towards consensus."
    else:
        insight = "The discussion maintained a balanced, analytical tone with no major emotional spikes."

    return {"insight": insight}