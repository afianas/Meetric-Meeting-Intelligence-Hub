from fastapi import APIRouter, UploadFile, File
import uuid

from app.services.llm_service import extract_action_items
from app.services.segmentation_llm_service import segment_transcript
from app.services.emotion_service import analyze_emotion
from app.services.embedding_service import get_embedding
from app.services.storage_service import add_meeting
from app.services.vector_service import add_vector

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")

    # 🔹 Step 1: Extract summary
    analysis = extract_action_items(text)

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

    # 🔹 Step 3: Save meeting
    saved = add_meeting({
        "analysis": analysis,
        "segments": processed_segments
    })

    meeting_id = str(saved["_id"])

    # 🔹 Step 4: Add to FAISS
    for seg in processed_segments:
        add_vector(seg["embedding"], seg["segment_id"])

    return {
        "id": meeting_id,
        "analysis": analysis,
        "segments_count": len(processed_segments)
    }