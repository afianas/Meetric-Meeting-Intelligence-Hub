from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import Optional
import uuid
import logging
import asyncio
from datetime import datetime

from app.services.llm_service import extract_action_items
from app.services.segmentation_llm_service import segment_transcript
from app.services.embedding_service import get_embedding
from app.services.storage_service import add_meeting
from app.services.vector_service import upsert_meeting_vectors, search_vector
from app.utils.task_registry import init_task, update_task

logger = logging.getLogger("app.upload_route")
router = APIRouter()

async def run_ingestion_pipeline(job_id: str, file_content: bytes, filename: str, meeting_name: Optional[str]):
    """
    Background Task: Unified Ingestion Pipeline with Progress Reporting
    """
    try:
        start_time = datetime.utcnow()
        text = file_content.decode("utf-8")
        
        # 🔹 Stage 1: Uploading/Wait (0-10%)
        update_task(job_id, status="processing", progress=5, message="Uploading transcript")
        await asyncio.sleep(0.5) # Small padding for UI visibility
        
        # 🔹 Stage 2: Segmentation & Emotion (10-50%)
        update_task(job_id, progress=10, message="Segmenting transcript")
        processed_segments = await segment_transcript(text, job_id=job_id)
        
        # 🔹 Stage 3: Extract Insights (50-70%)
        update_task(job_id, progress=50, message="Extracting insights")
        analysis = await extract_action_items(processed_segments if processed_segments else text)
        
        # ✅ Canonical Schema: Standardize on meeting_name
        user_provided_name = (meeting_name or "").strip()
        if user_provided_name:
            analysis["meeting_name"] = user_provided_name
        elif not analysis.get("meeting_name"):
            analysis["meeting_name"] = filename.rsplit(".", 1)[0].replace("_", " ").title()
        
        analysis["date"] = datetime.utcnow().strftime("%Y-%m-%d")
        analysis["word_count"] = len(text.split())
        analysis["speakers_identified"] = len({seg["speaker"] for seg in processed_segments if seg.get("speaker")})

        # Ensure action items have default fields
        for item in analysis.get("action_items", []):
            if isinstance(item, dict):
                item["status"] = item.get("status", "pending")
                item["completed"] = item.get("completed", False)

        # 🔹 Stage 4: Embed segments (70-90%)
        update_task(job_id, progress=70, message="Generating embeddings")
        total_segs = len(processed_segments)
        for i, seg in enumerate(processed_segments):
            seg["embedding"] = get_embedding(seg["text"])
            if i % 5 == 0: # Update every 10 segments to avoid spamming
                p = int(70 + (i / total_segs) * 20)
                update_task(job_id, progress=p)

        # 🔹 Stage 5: Indexing (90-99%)
        update_task(job_id, progress=90, message="Indexing data")
        
        # Save to MongoDB
        saved = add_meeting({
            "analysis": analysis,
            "segments": processed_segments
        })
        meeting_id = str(saved["_id"])

        # Index in Pinecone
        upsert_meeting_vectors(meeting_id, analysis["meeting_name"], processed_segments)

        # Decision Tracing
        decisions = analysis.get("decisions", [])
        decision_traces = []
        for decision in decisions:
            decision_text = decision if isinstance(decision, str) else decision.get("decision", "")
            decision_emb = get_embedding(decision_text)
            matches = search_vector(decision_emb, meeting_id=meeting_id, top_k=2)
            evidence = []
            for match in matches:
                meta = match["metadata"]
                evidence.append({
                    "segment_id": meta.get("segment_id"),
                    "speaker": meta.get("speaker"),
                    "text": meta.get("text")
                })
            decision_traces.append({"decision": decision_text, "evidence": evidence})

        # Sync traces back
        from app.db.database import collection
        from bson import ObjectId
        collection.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"analysis.decision_traces": decision_traces}})
        analysis["decision_traces"] = decision_traces

        # 🏁 Finalize
        update_task(
            job_id, 
            status="completed", 
            progress=100, 
            message="Completed",
            result={
                "id": meeting_id,
                "meeting_name": analysis["meeting_name"],
                "segments_count": len(processed_segments)
            }
        )

    except Exception as e:
        logger.error(f"❌ Ingestion Pipeline Failed: {e}")
        update_task(job_id, status="failed", error_message=str(e))

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    meeting_name: Optional[str] = Form(None)
):
    """
    Unified Ingestion Pipeline (Backgrounded)
    """
    job_id = str(uuid.uuid4())
    init_task(job_id)
    
    # Read content immediately as the UploadFile object might be closed after request returns
    content = await file.read()
    
    background_tasks.add_task(
        run_ingestion_pipeline, 
        job_id, 
        content, 
        file.filename, 
        meeting_name
    )
    
    return {"job_id": job_id}