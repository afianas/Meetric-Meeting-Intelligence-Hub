import logging
from sentence_transformers import CrossEncoder

logger = logging.getLogger("app.reranker_service")

try:
    # Using base model for balance of precision and latency
    reranker = CrossEncoder("BAAI/bge-reranker-base")
    logger.info("✅ BGE Reranker loaded successfully.")
except Exception as e:
    logger.error(f"❌ Failed to load BGE Reranker: {e}")
    reranker = None


def rerank(query: str, segments: list, top_n: int = 20):
    """
    Rerank segments based on relevance to the query.
    Expects segments to have a 'text' field in their metadata.
    """
    if not reranker or not segments:
        return []

    try:
        pairs = [(query, seg.get("text", "")) for seg in segments]
        scores = reranker.predict(pairs)

        scored = list(zip(scores, segments))
        scored.sort(reverse=True, key=lambda x: x[0])

        return scored[:top_n]
    except Exception as e:
        logger.error(f"🚨 Reranking failed: {e}")
        return []