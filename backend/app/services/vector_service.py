import faiss
import numpy as np

# MiniLM embedding size
DIMENSION = 384

# FAISS index (L2 distance)
index = faiss.IndexFlatL2(DIMENSION)

# mapping FAISS index → MongoDB _id
id_map = []


def add_vector(embedding, mongo_id):
    vector = np.array([embedding]).astype("float32")
    index.add(vector)
    id_map.append(mongo_id)


def search_vector(query_embedding, top_k=3):
    if index.ntotal == 0:
        return []

    query = np.array([query_embedding]).astype("float32")

    distances, indices = index.search(query, top_k)

    results = []
    for idx in indices[0]:
        if idx < len(id_map):
            results.append(id_map[idx])

    return results