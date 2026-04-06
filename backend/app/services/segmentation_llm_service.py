import json
import logging
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from app.services.chat_service import call_llm
from app.utils.llm_utils import recover_json, estimate_tokens, chunk_text, normalize_text
from app.services.emotion_service import analyze_emotion
from app.models.llm_schemas import TranscriptSegment
from pydantic import ValidationError

from app.utils.task_registry import update_task
logger = logging.getLogger("app.segmentation_service")

# 🏛️ Segmentation Pipeline Constants
CHUNK_TARGET_TOKENS = 2000
OVERLAP_PERCENT = 0.15
MAX_CONCURRENCY = 1

async def segment_transcript(text: str, job_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Robust Ingestion Pipeline:
    1. Chunking (Token-Aware + Overlap)
    2. Parallel Segmentation (Controlled Concurrency)
    3. JSON Recovery & Validation
    4. Ordered Merge & Overlap-Aware Deduplication
    5. Final Semantic Enrichment (Emotion)
    """
    if not text: return []
    
    total_tokens = estimate_tokens(text)
    
    # 🔹 Phase 1: Chunking (If needed)
    if total_tokens <= CHUNK_TARGET_TOKENS * 1.2: # 20% grace margin
        logger.info(f"📄 Small transcript ({total_tokens} tokens). Processing as single chunk.")
        chunk_results = [await _process_segmentation_chunk(text, chunk_index=0)]
    else:
        chunks = chunk_text(text, max_tokens=CHUNK_TARGET_TOKENS, overlap=OVERLAP_PERCENT)
        logger.info(f"📦 Large transcript ({total_tokens} tokens). Split into {len(chunks)} chunks.")
        total_chunks = len(chunks)
        
        # 🔹 Phase 2: Map Phase (Parallel Extraction)
        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        
        async def task(chunk_text: str, idx: int):
            async with semaphore:
                # 📢 Report Progress
                if job_id:
                    # Map progress from 10% to 50%
                    p = int(10 + (idx / total_chunks) * 40)
                    update_task(job_id, progress=p, message=f"Segmenting transcript (chunk {idx + 1} of {total_chunks})")
                
                # Add small jitter to avoid simultaneous TPM bursts
                await asyncio.sleep(idx * 0.1) 
                return await _process_segmentation_chunk(chunk_text, chunk_index=idx)

        tasks = [task(c, i) for i, c in enumerate(chunks)]
        chunk_results = await asyncio.gather(*tasks)
    
    # 🔹 Phase 3: Reduce Phase (Merge & Deduplicate)
    processed = _merge_and_deduplicate(chunk_results)
    
    if not processed:
        logger.warning("⚠️ Segmentation failed to produce any segments. Generating fallback segment.")
        # Fallback: Create a single segment with the entire transcript
        processed = [{
            "segment_id": str(uuid.uuid4()),
            "speaker": "Speaker (Unidentified)",
            "role": "Participant",
            "text": text.strip(),
            "emotion": "Neutral",
            "emotion_score": 1.0,
            "timestamp": 0
        }]
        
    return processed

def is_valid_segments(data: Any, chunk_index: int) -> List[Dict[str, Any]]:
    """
    Resilient validation and normalization:
    - Maps "Text" -> "text", "Speaker" -> "speaker"
    - Strips whitespace
    - Filters out invalid items (Partial Recovery)
    """
    if not isinstance(data, list):
        logger.warning(f"⚠️ Chunk {chunk_index}: Expected list from LLM, got {type(data)}")
        return []

    valid_items = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            logger.debug(f"⏭️ Chunk {chunk_index}[{i}]: Skipping non-dict item")
            continue
        
        # 1. Light Normalization (Case Correction)
        normalized = {}
        for k, v in item.items():
            k_low = k.lower()
            if k_low in ["text", "speaker"]:
                normalized[k_low] = str(v).strip()
        
        # 2. Strict Key Validation
        if "speaker" in normalized and "text" in normalized:
            if normalized["speaker"] and normalized["text"]:
                valid_items.append(normalized)
            else:
                logger.debug(f"⏭️ Chunk {chunk_index}[{i}]: Missing content in required fields")
        else:
            missing = [k for k in ["speaker", "text"] if k not in normalized]
            logger.debug(f"⏭️ Chunk {chunk_index}[{i}]: Missing required keys: {missing}")

    return valid_items

async def _process_segmentation_chunk(text: str, chunk_index: int) -> List[Dict[str, Any]]:
    """
    Optimized 2-Tier Linear Strategy:
    Attempt 1: 8B Model (Fast, 15s timeout)
    Attempt 2: 70B Model (Strong Fallback, 60s timeout)
    """
    system_instruction = (
        "You are a transcript segmentation engine. "
        "Your task is to convert the given meeting transcript into structured speaker segments."
    )
    
    prompt = f"""
STRICT JSON OUTPUT REQUIRED.
- Return ONLY a valid JSON array of objects.
- Each object MUST have: "speaker" (string) and "text" (string).
- Do NOT include any explanations or markdown formatting.

EXAMPLE OF CORRECT OUTPUT:
[
  {{"speaker": "Alice", "text": "Hello everyone, let's start the meeting."}},
  {{"speaker": "Bob", "text": "Hi Alice, I'm ready."}}
]

TRANSCRIPT CHUNK {chunk_index}:
{text}
"""

    # --- Attempt 1: Fast Path (8B) ---
    logger.info(f"🔄 Chunk {chunk_index}: Attempt 1 (8B Model - 15s Timeout)")
    try:
        loop = asyncio.get_event_loop()
        res1 = await loop.run_in_executor(None, call_llm, prompt, system_instruction, "llama-3.1-8b-instant", 15)
        parsed1 = recover_json(res1)
        valid1 = is_valid_segments(parsed1, chunk_index)
        
        if valid1:
            logger.info(f"✅ Chunk {chunk_index}: Success on Attempt 1 ({len(valid1)} segments)")
            return _finalize_segments(valid1, chunk_index)
        
        reason = "Validation failed (0 valid segments)" if parsed1 else "JSON recovery failed"
    except Exception as e:
        reason = f"Execution error: {str(e)}"
        logger.warning(f"⚠️ Chunk {chunk_index}: Attempt 1 failed. {reason}")

    # --- Attempt 2: Strong Path (70B Fallback) ---
    logger.info(f"🔥 Chunk {chunk_index}: Attempt 2 (70B Fallback Triggered - Reason: {reason})")
    try:
        loop = asyncio.get_event_loop()
        res2 = await loop.run_in_executor(None, call_llm, prompt, system_instruction, "llama-3.3-70b-versatile", 60)
        parsed2 = recover_json(res2)
        valid2 = is_valid_segments(parsed2, chunk_index)
        
        if valid2:
            logger.info(f"✅ Chunk {chunk_index}: Success on Attempt 2 ({len(valid2)} segments)")
            return _finalize_segments(valid2, chunk_index)
    except Exception as e:
        logger.error(f"❌ Chunk {chunk_index}: Attempt 2 failed: {e}")

    logger.error(f"💀 Chunk {chunk_index}: All LLM attempts failed. Fallback to ingestion safety net.")
    return []

def _finalize_segments(valid_items: List[Dict[str, Any]], chunk_index: int) -> List[Dict[str, Any]]:
    """Helper to transform normalized dicts into Pydantic-validated segment dicts."""
    final_segments = []
    for i, item in enumerate(valid_items):
        try:
            obj = TranscriptSegment(**item)
            seg_dict = obj.model_dump()
            seg_dict["chunk_index"] = chunk_index
            seg_dict["local_index"] = i
            final_segments.append(seg_dict)
        except ValidationError:
            continue
    return final_segments

def _merge_and_deduplicate(chunk_results: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Combines segments from all chunks, sorts them, and removes duplicates from overlaps.
    """
    # 1. Flatten and Sort by (chunk_index, local_index)
    all_segments = [seg for chunk in chunk_results for seg in chunk]
    all_segments.sort(key=lambda x: (x["chunk_index"], x["local_index"]))
    
    # 2. Overlap-Aware Deduplication using normalized text
    unique_segments = []
    seen_texts = set()
    
    logger.info(f"🧬 Deduplicating {len(all_segments)} raw segments...")
    
    for seg in all_segments:
        norm = normalize_text(seg["text"])
        if not norm: continue
        
        # Use a sliding window hash or just the normalized text
        # If the text is very long, we could use a hash.
        if norm not in seen_texts:
            seen_texts.add(norm)
            
            # 🧬 Semantic Enrichment: Run emotion classification (Synchronous DistilBERT)
            # This is fast enough to run sequentially here or could be parallelized too.
            emotion_data = analyze_emotion(seg["text"])
            
            unique_segments.append({
                "segment_id": str(uuid.uuid4()),
                "speaker": seg.get("speaker", "Unknown"),
                "role": seg.get("role", "Participant"),
                "text": seg["text"],
                "emotion": emotion_data["emotion"],
                "emotion_score": emotion_data["confidence"],
                "timestamp": seg.get("timestamp", 0)
            })

    logger.info(f"✨ Pipeline Complete: {len(unique_segments)} clean segments generated.")
    return unique_segments