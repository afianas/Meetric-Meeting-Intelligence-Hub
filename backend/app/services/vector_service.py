import os
import numpy as np
import logging
from pinecone import Pinecone
from typing import List, Dict, Any, Optional

logger = logging.getLogger("app.vector_service")

# Constants
VECTOR_DIMENSION = 384
METRIC = "cosine"

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

if not PINECONE_API_KEY or not PINECONE_INDEX_NAME:
    logger.error("⚠️ PINECONE_API_KEY or PINECONE_INDEX_NAME not found in environment variables.")
    pc = None
    index = None
else:
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        # Fast validation
        index.describe_index_stats()
        logger.info(f"✅ Successfully connected to Pinecone index: {PINECONE_INDEX_NAME}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Pinecone: {e}")
        pc = None
        index = None


def upsert_meeting_vectors(meeting_id: str, meeting_title: str, segments: List[Dict[str, Any]]):
    """
    Batch upsert vectors for a meeting with enriched metadata.
    Ensures idempotency by using deterministic IDs: {meeting_id}_{segment_id}
    """
    if index is None:
        logger.error("❌ Pinecone not initialized. Cannot upsert.")
        return False

    vectors_to_upsert = []
    for seg in segments:
        vectors_to_upsert.append({
            "id": f"{meeting_id}_{seg['segment_id']}",
            "values": seg["embedding"].tolist() if hasattr(seg["embedding"], "tolist") else seg["embedding"],
            "metadata": {
                "meeting_id": meeting_id,
                "meeting_title": meeting_title,
                "segment_id": seg["segment_id"],
                "speaker": seg.get("speaker", "Unknown"),
                "role": seg.get("role", "Participant"),
                "text": seg.get("text", ""),
                "emotion": seg.get("emotion", "Neutral"),
                "timestamp": seg.get("timestamp", 0)
            }
        })

    try:
        # Use prod namespace to isolate environments
        index.upsert(vectors=vectors_to_upsert, namespace="prod")
        logger.info(f"✅ Upserted {len(vectors_to_upsert)} vectors for meeting {meeting_id}")
        return True
    except Exception as e:
        logger.error(f"❌ Error upserting to Pinecone: {e}")
        return False


def add_vector(vector, segment_id, meeting_id, meeting_title="Unknown", extra_metadata=None):
    """
    Maintaining backward compatibility for single vector adds.
    """
    if index is None:
        return

    metadata = {
        "meeting_id": meeting_id,
        "meeting_title": meeting_title,
        "segment_id": segment_id,
        "speaker": "Unknown",
        "role": "Participant",
        "text": "",
        "emotion": "Neutral",
        "timestamp": 0
    }
    if extra_metadata:
        metadata.update(extra_metadata)

    try:
        index.upsert(vectors=[{
            "id": f"{meeting_id}_{segment_id}",
            "values": vector.tolist() if hasattr(vector, "tolist") else vector,
            "metadata": metadata
        }], namespace="prod")
    except Exception as e:
        logger.error(f"❌ Error adding vector to Pinecone: {e}")


def search_vector(query_vector, meeting_id=None, top_k=30):
    """
    Search vectors in Pinecone with high recall and filtering.
    Returns raw matches to support the reranking pipeline.
    """
    if index is None:
        logger.error("❌ Pinecone not initialized.")
        return []

    filter_dict = {}
    if meeting_id:
        filter_dict["meeting_id"] = meeting_id

    try:
        res = index.query(
            vector=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True,
            namespace="prod"
        )
        
        logger.debug(f"🔍 Pinecone search returned {len(res['matches'])} candidates.")
        return res["matches"]
    except Exception as e:
        logger.error(f"❌ Error searching Pinecone: {e}")
        return []


def remove_meeting_vectors(meeting_id: str):
    """
    Delete all vectors associated with a meeting ID in the prod namespace.
    """
    if index is None:
        return False

    try:
        index.delete(filter={"meeting_id": meeting_id}, namespace="prod")
        return True
    except Exception as e:
        logger.error(f"❌ Error deleting vectors from Pinecone: {e}")
        return False


def reset_vectors():
    """
    Clear all vectors in the prod namespace.
    """
    if index is None:
        return False

    try:
        index.delete(delete_all=True, namespace="prod")
        return True
    except Exception as e:
        logger.error(f"❌ Error resetting Pinecone index: {e}")
        return False