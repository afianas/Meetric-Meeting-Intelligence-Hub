import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.services.chat_service import call_llm
from app.utils.llm_utils import chunk_text, recover_json, estimate_tokens, normalize_text
from app.models.llm_schemas import ActionItemSchema, MeetingAnalysisSchema
from pydantic import ValidationError

logger = logging.getLogger("app.llm_service")

# 🏛️ Centralized Pipeline Constants
CHUNK_TARGET_TOKENS = 2000
OVERLAP_PERCENT = 0.15

from typing import List, Dict, Any, Optional, Union

async def extract_action_items(transcript_data: Union[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Scalable Ingestion Pipeline:
    1. Input Normalization (Handle raw text or pre-processed segments)
    2. Chunking (Token-Aware)
    3. Map Phase (Parallel Extraction)
    4. Reduce Phase (Synthesis & Deduplication)
    """
    if not transcript_data:
        return {"decisions": [], "action_items": []}
    
    # 🔹 Phase 0: Input Normalization
    if isinstance(transcript_data, list):
        # Convert segments back to a structured text format for high-level reasoning
        full_text = "\n".join([f"[{s.get('speaker', 'Unknown')}]: {s.get('text', '')}" for s in transcript_data])
    else:
        full_text = transcript_data

    total_tokens = estimate_tokens(full_text)
    
    # 🔹 Phase 1: Chunking (If needed)
    if total_tokens <= CHUNK_TARGET_TOKENS:
        return _run_single_extraction(full_text)
    
    logger.info(f"📦 Large transcript detected ({total_tokens} tokens). Splitting into chunks...")
    chunks = chunk_text(full_text, max_tokens=CHUNK_TARGET_TOKENS, overlap=OVERLAP_PERCENT)
    
    # 🔹 Phase 2: Map Phase (Controlled Concurrency Extraction)
    logger.info(f"🗺️ Map Phase: Extracting insights from {len(chunks)} chunks...")
    
    raw_results = []
    # Semi-parallel execution to prevent TPM spikes (limit concurrency to 3)
    semaphore = asyncio.Semaphore(1)
    
    async def process_chunk(chunk_text: str, index: int):
        async with semaphore:
            return _run_single_extraction(chunk_text, chunk_index=index)

    tasks = [process_chunk(chunk, i) for i, chunk in enumerate(chunks)]
    raw_results = await asyncio.gather(*tasks)
    
    # 🔹 Phase 3: Reduce Phase (Synthesis & Deduplication)
    return _synthesize_results(raw_results)

def _run_single_extraction(text: str, chunk_index: Optional[int] = None) -> Dict[str, Any]:
    """
    Single-pass extraction with JSON recovery and Pydantic validation.
    """
    ctx = f"CHUNK {chunk_index}" if chunk_index is not None else "SINGLE"
    
    prompt = f"""
You are an expert meeting analyst. Extract decisions and action items from this transcript.

INSTRUCTIONS:
- Extract clear, professional decisions.
- Extract action items (id, who, task, deadline).
- Return ONLY valid JSON.

JSON FORMAT:
{{
  "decisions": ["Finalized the budget", ...],
  "action_items": [
    {{ "id": 1, "who": "John", "task": "Update the spreadsheet", "deadline": "Friday" }}
  ]
}}

Transcript Content:
{text}
"""
    
    try:
        response = call_llm(prompt, model="llama-3.3-70b-versatile")
        parsed = recover_json(response)
        
        if not parsed:
            logger.error(f"❌ {ctx}: JSON Recovery failed for output.")
            return {"decisions": [], "action_items": []}
            
        # 🛡️ Pydantic Validation Tier
        validated = MeetingAnalysisSchema(**parsed)
        return validated.model_dump()
        
    except ValidationError as ve:
        logger.error(f"❌ {ctx}: Validation error: {ve}")
        # Partial recovery: Try to extract at least some valid items if schema is partially correct
        return parsed if isinstance(parsed, dict) else {"decisions": [], "action_items": []}
    except Exception as e:
        logger.error(f"❌ {ctx}: Extraction logic failed: {e}")
        return {"decisions": [], "action_items": []}

def _synthesize_results(raw_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Reduces multiple chunk extractions into a single master analysis.
    Performs multi-level deduplication and cross-chunk synthesis.
    """
    logger.info("🧬 Reduce Phase: Synthesizing results...")
    
    master_decisions = []
    master_actions = []
    
    # Track normalized texts for level-2 deduplication
    seen_decisions = set()
    seen_tasks = set()
    
    for res in raw_results:
        # Deduplicate decisions
        for dec in res.get("decisions", []):
            norm = normalize_text(dec)
            if norm and norm not in seen_decisions:
                seen_decisions.add(norm)
                master_decisions.append(dec)
        
        # Deduplicate action items (who + normalized task)
        for act in res.get("action_items", []):
            norm_task = normalize_text(act.get("task", ""))
            who = normalize_text(act.get("who", "Unassigned"))
            key = f"{who}:{norm_task}"
            if norm_task and key not in seen_tasks:
                seen_tasks.add(key)
                master_actions.append(act)
                
    # Final cleanup (re-indexing IDs)
    for i, act in enumerate(master_actions):
        act["id"] = i + 1
        
    return {
        "decisions": master_decisions,
        "action_items": master_actions
    }