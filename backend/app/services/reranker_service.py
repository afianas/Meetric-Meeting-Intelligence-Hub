from sentence_transformers import CrossEncoder

reranker = CrossEncoder("BAAI/bge-reranker-base")


def rerank(query, segments, top_n=5):
    pairs = [(query, seg["text"]) for seg in segments]

    scores = reranker.predict(pairs)

    scored = list(zip(scores, segments))
    scored.sort(reverse=True, key=lambda x: x[0])

    return scored[:top_n]  # top segments