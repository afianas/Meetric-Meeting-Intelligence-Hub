from sentence_transformers import CrossEncoder

reranker = CrossEncoder("BAAI/bge-reranker-base")


def rerank(query, segments):
    pairs = [(query, seg["text"]) for seg in segments]

    scores = reranker.predict(pairs)

    scored = list(zip(scores, segments))
    scored.sort(reverse=True, key=lambda x: x[0])

    return scored[:5]  # top segments