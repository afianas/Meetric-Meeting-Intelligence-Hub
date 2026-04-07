import logging
from typing import List, Dict, Any
from app.utils.hf_utils import query_hf_api, is_valid_hf_response

logger = logging.getLogger("app.reranker_service")
RERANKER_MODEL = "BAAI/bge-reranker-base"

def rerank(query: str, segments: List[Dict[str, Any]], top_n: int = 20):
    """
    Rerank segments based on relevance to the query using Hugging Face Inference API.
    Expects segments to have a 'text' field in their metadata.
    """
    if not segments:
        return []

    try:
        # Format input pairs for InferenceClient.text_classification
        # The BGE model on HF Inference API handles this as a classification task.
        formatted_inputs = [f"{query} [SEP] {seg.get('text', '')}" for seg in segments]
        payload = {"inputs": formatted_inputs}
        
        response = query_hf_api(RERANKER_MODEL, payload, task_type="text_classification")

        if not is_valid_hf_response(response) or not isinstance(response, list):
            logger.error(f"❌ Failed to get reranking scores for model {RERANKER_MODEL}")
            return [(0.0, seg) for seg in segments[:top_n]]

        # The InferenceClient returns a list of results (one per input)
        # Each result is a list of dicts (for classification) or a single dict.
        # For BGE, it usually returns a list like: [{'label': 'LABEL_0', 'score': 0.99}, ...]
        scores = []
        for res in response:
            if isinstance(res, list) and len(res) > 0:
                # Top class score
                scores.append(res[0].get("score", 0.0))
            elif isinstance(res, dict):
                scores.append(res.get("score", 0.0))
            elif hasattr(res, "score"): # Handle Category objects from InferenceClient
                scores.append(res.score)
            else:
                scores.append(0.0)

        scored = list(zip(scores, segments))
        scored.sort(reverse=True, key=lambda x: x[0])

        return scored[:top_n]

    except Exception as e:
        logger.error(f"🚨 Reranking failed: {e}")
        return []