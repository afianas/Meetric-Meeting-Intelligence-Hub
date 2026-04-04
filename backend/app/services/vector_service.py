import faiss
import numpy as np

# Switch to Inner Product for Cosine Similarity (requires normalized vectors)
index = faiss.IndexFlatIP(384) 

# maps index → {"segment_id": str, "meeting_id": str}
id_map = {} 


def add_vector(vector, segment_id, meeting_id):
    vec = np.array(vector).astype("float32").reshape(1, -1)
    faiss.normalize_L2(vec)  # Crucial for Cosine Similarity
    
    current_idx = index.ntotal
    index.add(vec)
    id_map[current_idx] = {"segment_id": segment_id, "meeting_id": meeting_id}


def search_vector(query_vector, meeting_id=None, top_k=10):
    if index.ntotal == 0:
        return []

    q_vec = np.array(query_vector).astype("float32").reshape(1, -1)
    faiss.normalize_L2(q_vec)

    if meeting_id:
        # ✅ Correct Scoped Retrieval: Filter first, then score
        candidate_indices = [i for i, meta in id_map.items() if meta["meeting_id"] == meeting_id]
        if not candidate_indices:
            return []
        
        # Reconstruct normalized vectors for these candidates
        # (Since we used normalize_L2 on add, dot product == cosine similarity)
        vectors = np.array([index.reconstruct(i) for i in candidate_indices])
        
        # Compute dot product manually: (N, D) @ (1, D).T -> (N, 1)
        similarities = vectors @ q_vec.T
        
        # Get top-k within these candidates
        sorted_rel_indices = np.argsort(similarities.flatten())[::-1]
        
        results = []
        for rel_idx in sorted_rel_indices[:top_k]:
            results.append(id_map[candidate_indices[rel_idx]]["segment_id"])
        return results

    else:
        # Global Search
        search_k = min(index.ntotal, max(top_k, 100))
        scores, indices = index.search(q_vec, search_k)
        
        results = []
        for i in indices[0]:
            if i >= 0 and i in id_map:
                results.append(id_map[i]["segment_id"])
                if len(results) >= top_k:
                    break
        return results


def remove_meeting_vectors(meeting_id):
    global id_map
    if index.ntotal == 0:
        return

    # 1. Identify indices to keep
    total = index.ntotal
    vectors = index.reconstruct_n(0, total)
    
    keep_indices = [i for i, meta in id_map.items() if meta["meeting_id"] != meeting_id]
    
    # 2. Rebuild Index
    index.reset()
    new_id_map = {}
    if keep_indices:
        new_vectors = vectors[keep_indices]
        index.add(new_vectors)
        
        # 3. Rebuild Metadata map
        for new_i, old_i in enumerate(keep_indices):
            new_id_map[new_i] = id_map[old_i]
            
    id_map = new_id_map


def reset_vectors():
    global id_map
    index.reset()
    id_map.clear()