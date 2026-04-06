import json
import re
import logging
import math
from typing import Optional, List, Any

logger = logging.getLogger("app.llm_utils")

def estimate_tokens(text: str) -> int:
    """Conservative token estimation (approx 4 chars per token). Overestimates to prevent limit hits."""
    if not text: return 0
    return int(len(text) / 3.5) # Use 3.5 to be extra safe

def chunk_text(text: str, max_tokens: int = 6000, overlap: float = 0.15) -> List[str]:
    """
    Splits text into chunks with 15% overlap to ensure context preservation across boundaries.
    """
    if not text: return []
    
    tokens_per_char = 3.5
    char_chunk_size = int(max_tokens * tokens_per_char)
    char_overlap = int(char_chunk_size * overlap)
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + char_chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        
        # 🛡️ Guard against invalid step size to prevent infinite loops
        step = max(1, char_chunk_size - char_overlap)
        start += step
        
    return chunks

def recover_json(text: str) -> Optional[Any]:
    """
    4-Tier JSON Recovery:
    1. Direct parse (json.loads)
    2. Markdown JSON block extraction (```json ... ```)
    3. Any Markdown code block extraction (``` ... ```)
    4. Structural regex (first [ array or { object)
    5. Truncated JSON recovery
    """
    if not text: return None
    
    # 🛡️ Quote Normalization: Fix common LLM formatting issues
    text = text.strip()
    text = text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    
    # Tier 1: Direct JSON
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Tier 2 & 3: Markdown Code Blocks
    try:
        blocks = re.findall(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        for block in blocks:
            try:
                cleaned_block = re.sub(r",\s*([\]}])", r"\1", block.strip())
                return json.loads(cleaned_block)
            except (json.JSONDecodeError, TypeError):
                continue
    except Exception:
        pass

    # Tier 4: Structural regex (Non-Greedy Search)
    try:
        # Match from the FIRST [ to the LAST ] (for arrays) 
        array_match = re.search(r"(\[.*?\])", text, re.DOTALL)
        if array_match:
            try: 
                cleaned_array = re.sub(r",\s*([\]}])", r"\1", array_match.group(0).strip())
                return json.loads(cleaned_array)
            except (json.JSONDecodeError, TypeError): pass
            
        # Match from the FIRST { to the LAST } (for objects)
        object_match = re.search(r"(\{.*?\})", text, re.DOTALL)
        if object_match:
            try: 
                cleaned_obj = re.sub(r",\s*([\]}])", r"\1", object_match.group(0).strip())
                return json.loads(cleaned_obj)
            except (json.JSONDecodeError, TypeError): pass
    except Exception:
        pass

    # Tier 5: Truncated JSON Recovery
    try:
        if text.startswith('[') and not text.endswith(']'):
            last_bracket = text.rfind('}')
            if last_bracket != -1:
                try:
                    return json.loads(text[:last_bracket+1] + ']')
                except (json.JSONDecodeError, TypeError): pass
    except Exception:
        pass
        
    logger.error(f"❌ JSON Recovery Failed. Response snippet: {text[:200]}...")
    return None

def normalize_text(text: str) -> str:
    """Normalize text for cross-chunk deduplication."""
    if not text: return ""
    return " ".join(text.lower().strip().split())
