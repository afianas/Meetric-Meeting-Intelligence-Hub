from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import uuid
from datetime import datetime

from app.services.llm_service import extract_action_items
from app.services.segmentation_llm_service import segment_transcript
from app.services.emotion_service import analyze_emotion
from app.services.embedding_service import get_embedding
from app.services.storage_service import add_meeting
from app.services.vector_service import add_vector

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    meeting_name: Optional[str] = Form(None)
):
    content = await file.read()
    text = content.decode("utf-8")

    # 🔹 Step 1: Extract summary, decisions, and action items via LLM
    analysis = extract_action_items(text)
    
    # ✅ Override meeting_name if provided by user, otherwise keep LLM's or set default
    user_provided_name = (meeting_name or "").strip()
    if user_provided_name:
        analysis["meeting_name"] = user_provided_name
    elif not analysis.get("meeting_name"):
        # Fallback: use filename without extension
        analysis["meeting_name"] = file.filename.rsplit(".", 1)[0].replace("_", " ").title()
    
    # ✅ Add upload date
    analysis["date"] = datetime.utcnow().strftime("%Y-%m-%d")

    # ✅ Add status to action items
    action_items = analysis.get("action_items", [])
    for item in action_items:
        if isinstance(item, dict):
            item["status"] = "pending"
            item["completed"] = False

    # 🔹 Step 2: LLM segmentation
    segments = segment_transcript(text)

    processed_segments = []

    for seg in segments:
        seg_text = seg.get("text", "")
        if not seg_text:
            continue

        seg_id = str(uuid.uuid4())

        emotion_data = analyze_emotion(seg_text)
        embedding = get_embedding(seg_text).tolist()

        processed_segments.append({
            "segment_id": seg_id,
            "speaker": seg.get("speaker", "Unknown"),
            "role": seg.get("role", "Unknown"),
            "text": seg_text,
            "emotion": emotion_data["emotion"],
            "emotion_score": float(emotion_data["confidence"]),
            "embedding": embedding
        })
    
    # 🔍 Decision Traceability — match each decision to relevant transcript segments
    decisions = analysis.get("decisions", [])
    decision_traces = []

    for decision in decisions:
        decision_text = decision if isinstance(decision, str) else decision.get("decision", "")
        matches = []
        
        # Find segments with keyword overlap
        decision_words = set(w.lower() for w in decision_text.split() if len(w) > 3)
        
        for seg in processed_segments:
            seg_words = set(w.lower() for w in seg["text"].split())
            overlap = decision_words & seg_words
            if len(overlap) >= 2:  # require at least 2 meaningful word matches
                matches.append({
                    "segment_id": seg["segment_id"],
                    "speaker": seg["speaker"],
                    "role": seg.get("role", ""),
                    "text": seg["text"],
                    "overlap_score": len(overlap)
                })
        
        # Sort by overlap score descending, keep top 2
        matches.sort(key=lambda x: x["overlap_score"], reverse=True)
        
        decision_traces.append({
            "decision": decision_text,
            "evidence": matches[:2]
        })

    analysis["decision_traces"] = decision_traces
    
    unique_speakers = len({seg["speaker"] for seg in processed_segments if seg.get("speaker")})
    word_count = len(text.split())
    
    analysis["word_count"] = word_count
    analysis["speakers_identified"] = unique_speakers

    # 🔹 Step 3: Save meeting
    saved = add_meeting({
        "analysis": analysis,
        "segments": processed_segments
    })

    meeting_id = str(saved["_id"])

    # 🔹 Step 4: Add to FAISS (with strict meeting_id mapping)
    for seg in processed_segments:
        add_vector(seg["embedding"], seg["segment_id"], meeting_id)

    return {
        "id": meeting_id,
        "meeting_name": analysis.get("meeting_name"),
        "analysis": analysis,
        "segments_count": len(processed_segments),
        "word_count": word_count,
        "speakers_identified": unique_speakers
    }