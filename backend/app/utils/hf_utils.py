import os
import logging
from typing import Any, Dict, List, Optional, Union
import numpy as np
from huggingface_hub import InferenceClient

logger = logging.getLogger("app.hf_utils")

HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

# Initialize the modern InferenceClient
# Note: provider="hf-inference" utilizes the serverless infrastructure.
client = InferenceClient(api_key=HF_API_KEY)

def is_valid_hf_response(response: Any) -> bool:
    """
    Safely checks if a Hugging Face response is valid (not None and not empty).
    Prevents "ambiguous truth value" errors with NumPy arrays.
    """
    if response is None:
        return False
    # For NumPy arrays, use .size or .any()
    if isinstance(response, np.ndarray):
        return response.size > 0
    # For lists/dicts/strings
    if hasattr(response, "__len__"):
        return len(response) > 0
    return True

def query_hf_api(
    model_id: str, 
    payload: Dict[str, Any],
    task_type: Optional[str] = None
) -> Optional[Union[Dict[str, Any], List[Any]]]:
    """
    Standardized helper for Hugging Face Inference API using InferenceClient.
    Supports dynamic task selection or generic POST fallback.
    """
    if not HF_API_KEY:
        logger.error("❌ HUGGING_FACE_API_KEY is not set.")
        return None

    response = None
    try:
        # Use specific task methods if provided, otherwise fallback to generic post
        if task_type == "text_classification":
            # For emotion/sentiment
            response = client.text_classification(payload.get("inputs"), model=model_id)
        elif task_type == "feature_extraction":
            # For embeddings
            response = client.feature_extraction(payload.get("inputs"), model=model_id)
        elif task_type == "sentence_similarity":
            # For comparing source to multiple target sentences
            response = client.sentence_similarity(
                {
                    "source_sentence": payload.get("source_sentence"),
                    "sentences": payload.get("sentences")
                },
                model=model_id
            )
        else:
            # Generic POST for specialized tasks like reranking cross-encoders
            import requests
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            api_url = f"https://router.huggingface.co/hf-inference/models/{model_id}"
            res = requests.post(api_url, headers=headers, json=payload, timeout=30)
            res.raise_for_status()
            response = res.json()

    except Exception as e:
        logger.error(f"❌ HF Inference Failed for model {model_id}: {e}")
        return None

    # Normalization Layer: Ensure NumPy arrays don't leak into business logic
    if isinstance(response, np.ndarray):
        return response.tolist()

    # Handle nested lists that might contain NumPy arrays
    if isinstance(response, list):
        return [
            item.tolist() if isinstance(item, np.ndarray) else item
            for item in response
        ]

    return response
