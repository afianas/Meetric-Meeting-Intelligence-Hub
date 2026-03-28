from sentence_transformers import CrossEncoder

# Load once (important)
reranker = CrossEncoder("BAAI/bge-reranker-base")  # use base, not large (faster)


def rerank(query, meetings):
    """
    query: str
    meetings: list of meeting dicts
    """

    pairs = []

    for m in meetings:
        analysis = m.get("analysis", {})

        text = " ".join(analysis.get("decisions", [])) + " " + " ".join(
            [a.get("task", "") for a in analysis.get("action_items", [])]
        )

        pairs.append((query, text))

    scores = reranker.predict(pairs)

    # attach scores
    scored = list(zip(scores, meetings))

    # sort by score
    scored.sort(reverse=True, key=lambda x: x[0])

    # return top 2 meetings
    top_meetings = [m for _, m in scored[:5]]

    return top_meetings