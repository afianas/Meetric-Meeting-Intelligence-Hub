import faiss
import numpy as np

index = faiss.IndexFlatL2(384)  # assuming MiniLM

id_map = []  # maps index → {"segment_id": str, "meeting_id": str}


def add_vector(vector, segment_id, meeting_id):
    vec = np.array(vector).astype("float32").reshape(1, -1)
    index.add(vec)
    id_map.append({"segment_id": segment_id, "meeting_id": meeting_id})


def search_vector(query_vector, meeting_id=None, top_k=10):
    vec = np.array(query_vector).astype("float32").reshape(1, -1)
    
    # Always search a larger pool of candidates to ensure we find enough high-quality matches
    search_k = max(top_k * 5, 100)
    distances, indices = index.search(vec, search_k)

    results = []
    for i in indices[0]:
        if i >= 0 and i < len(id_map):
            mapping = id_map[i]
            if meeting_id is None or mapping["meeting_id"] == meeting_id:
                results.append(mapping["segment_id"])
                if len(results) >= top_k:
                    break

    return results

def reset_vectors():
    global id_map
    index.reset()
    id_map.clear()