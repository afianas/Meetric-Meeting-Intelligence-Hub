# Implementation Plan - Global Intelligence Upgrade (Refined)

The goal is to upgrade the RAG system to support diversity-aware, multi-meeting retrieval while ensuring zero regressions for focused, single-meeting queries. This refined plan incorporates strict mode gating, adaptive retrieval parameters, and safety fallbacks.

## Proposed Changes

### [Backend] [reranker_service.py](file:///c:/Users/afian/Desktop/meeting-intelligence-hub/backend/app/services/reranker_service.py)

#### [MODIFY]
- Update `rerank` function to accept a `top_n` parameter.
- This allows `chat.py` to request different context sizes based on the detected query mode.

### [Backend] [chat.py](file:///c:/Users/afian/Desktop/meeting-intelligence-hub/backend/app/routes/chat.py)

#### [MODIFY]
- **Refined `detect_query_mode(query)`**:
  - **Focused**: If query contains a meeting ID, a specific meeting name (case-insensitive check against DB), or if a `meeting_id` parameter is explicitly provided.
  - **Global**: If keywords like "across", "trends", "overall", "all meetings", or "summarize meetings" are present.
  - **Default**: Focused mode.
- **Adaptive Retrieval Logic**:
  - `if mode == "focused"`: `top_k=20`, `rerank_n=10`, no diversity sampling.
  - `if mode == "global"`: `top_k=50`, `rerank_n=30`, apply `diversity_sample(target=15)`.
- **Safety Fallback**:
  - In `global` mode, if `len(unique_meeting_ids) == 1`, automatically revert retrieval behavior to the top-scoring segments for that meeting.
- **Return `meetings_used`**: Ensure the final JSON response accurately counts unique meeting IDs represented in the context.

### [Backend] [chat_service.py](file:///c:/Users/afian/Desktop/meeting-intelligence-hub/backend/app/services/chat_service.py)

#### [MODIFY]
- Update `generate_answer(query, context, mode, meetings_used)`:
  - Only inject the global reasoning instruction if `mode == "global"` AND `meetings_used > 1`.
  - Global Instruction: *"You are analyzing multiple meetings. Identify patterns, similarities, and differences across meetings."*

### [Frontend] [query/page.tsx](file:///c:/Users/afian/Desktop/meeting-intelligence-hub/frontend/frontend/app/app/query/page.tsx)

#### [MODIFY]
- **Analysis Badge**: Display `"Analyzing {meetings_used} meetings"` badge in the AI response header if `meetings_used > 1`.
- This provides clear feedback that the system is synthesized cross-meeting data.

## Mode Comparison

| Mode | Trigger | Search (K) | LLM Context (N) | Diversity | LLM Prompt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Focused** | Default / ID Ref | 20 | 10 | None (Similarity) | Standard |
| **Global**  | Keyword Search | 50 | 15 | Diversified | Comparative |

## Verification Plan

### Automated Verification
- Query "What decisions were made in [Meeting Name]?" → Verify `meetings_used = 1` and focused mode.
- Query "Trends across all meetings" → Verify `meetings_used > 1` (if available) and diversity sampling.

### Manual Verification
- Verify the "Analyzing N meetings" badge appears correctly for global queries.
- Ensure focused queries remain precise and aren't diluted by irrelevant context from other meetings.
