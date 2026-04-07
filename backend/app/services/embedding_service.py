import logging
from app.utils.hf_utils import query_hf_api, is_valid_hf_response

logger = logging.getLogger("app.embedding_service")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def get_embedding(text: str):
    """
    Generate vector embeddings for the given text using the Hugging Face Inference API.
    """
    if not text.strip():
        logger.warning("⚠️ Empty text provided for embedding.")
        return []

    payload = {"inputs": text}
    response = query_hf_api(EMBEDDING_MODEL, payload, task_type="feature_extraction")

    if is_valid_hf_response(response) and isinstance(response, list):
        return response
    
    logger.error(f"❌ Failed to get embeddings for model {EMBEDDING_MODEL}")
    return []