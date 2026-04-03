from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import uuid
from datetime import datetime

from app.services.llm_service import extract_action_items
from app.services.segmentation_llm_service import segment_transcript
from app.services.emotion_service import analyze_emotion
from app.services.embedding_service import get_embedding
from app.services.storage_service import add_meeting
from app.services.vector_service import add_vector, search_vector

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
    
    # ✅ Canonical Schema: Standardize on meeting_name
    user_provided_name = (meeting_name or "").strip()
    if user_provided_name:
        analysis["meeting_name"] = user_provided_name
    elif not analysis.get("meeting_name"):
        analysis["meeting_name"] = file.filename.rsplit(".", 1)[0].replace("_", " ").title()
    
    analysis["date"] = datetime.utcnow().strftime("%Y-%m-%d")

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
    
    analysis["word_count"] = len(text.split())
    analysis["speakers_identified"] = len({seg["speaker"] for seg in processed_segments if seg.get("speaker")})

    # 🔹 Step 3: Save meeting to MongoDB first
    saved = add_meeting({
        "analysis": analysis,
        "segments": processed_segments
    })

    meeting_id = str(saved["_id"])

    # 🔹 Step 4: Index in FAISS
    for seg in processed_segments:
        add_vector(seg["embedding"], seg["segment_id"], meeting_id)

    # 🔹 Step 5: ✅ Traceability Fix - Use vector search within the SAME meeting
    decisions = analysis.get("decisions", [])
    decision_traces = []

    for decision in decisions:
        decision_text = decision if isinstance(decision, str) else decision.get("decision", "")
        # Embed decision for semantic matching
        decision_emb = get_embedding(decision_text).tolist()
        
        # Search ONLY this meeting's segments (Rethink: top_k=2 matches)
        # This uses the new scoped retrieval in vector_service which is 100% accurate within a meeting
        match_ids = search_vector(decision_emb, meeting_id=meeting_id, top_k=2)
        
        evidence = []
        for mid in match_ids:
            # Find the segment in our processed list
            found = next((s for s in processed_segments if s["segment_id"] == mid), None)
            if found:
                evidence.append({
                    "segment_id": found["segment_id"],
                    "speaker": found["speaker"],
                    "text": found["text"]
                })
        
        decision_traces.append({
            "decision": decision_text,
            "evidence": evidence
        })

    # Update the meeting document with final traces
    from app.db.database import collection
    from bson import ObjectId
    collection.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"analysis.decision_traces": decision_traces}})
    analysis["decision_traces"] = decision_traces

    return {
        "id": meeting_id,
        "meeting_name": analysis["meeting_name"],
        "analysis": analysis,
        "segments_count": len(processed_segments)
    }