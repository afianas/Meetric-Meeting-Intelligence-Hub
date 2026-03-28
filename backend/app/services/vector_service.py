import faiss
import numpy as np

index = faiss.IndexFlatL2(384)  # assuming MiniLM

id_map = []  # maps index → segment_id


def add_vector(vector, segment_id):
    vec = np.array(vector).astype("float32").reshape(1, -1)
    index.add(vec)
    id_map.append(segment_id)


def search_vector(query_vector, top_k=10):
    vec = np.array(query_vector).astype("float32").reshape(1, -1)
    distances, indices = index.search(vec, top_k)

    results = []
    for i in indices[0]:
        if i < len(id_map):
            results.append(id_map[i])

    return results