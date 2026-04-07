# Technical Design Document: Meetric Intelligence Hub

## 1. Problem Statement
Conventional meetings suffer from a lack of structured follow-through. Discussions are often disconnected from execution, and valuable insights are lost in unstructured transcripts. The absence of automated synthesis creates a **traceability gap** between a decision made and its corresponding action item, leading to operational inefficiency and information siloing.

## 2. Solution Overview
Meetric is a production-grade intelligence platform that transforms raw meeting transcripts into structured, queryable, and verifiable insights. It leverages a multi-tier LLM architecture and a robust RAG (Retrieval-Augmented Generation) pipeline to ensure that every decision and summary is grounded in the actual transcript, providing a "single source of truth."

## 3. System Architecture (Modular System Layers)
The system is partitioned into modular system layers to ensure separation of concerns:
- **Intelligence Layer**: Groq-hosted `Llama-3.3-70B` for reasoning, **Pinecone Serverless** for vector indexing, and **HuggingFace** (`all-MiniLM-L6-v2`) for embedding generation.
- **Execution Layer**: A task management system backed by **MongoDB Atlas** for document persistence, metadata tracking, and real-time state synchronization via **TanStack Query**.
- **Explainability Layer**: A custom mapping engine that correlates LLM outputs with source segments via in-ingestion vector-similarity search, ensuring every decision is auditable.
- **Source Traceability Layer**: A navigation architecture enabling segment-level deep linking from AI responses back to transcript dialogue. It incorporates smooth-scroll positioning, context-aware highlighting (±2 segments), and visual feedback (pulse animations).
- **Data Organization Layer**: A mutation-driven UI framework using **TanStack Query**, enabling dynamic client-side sorting and grouping strategies with real-time synchronization.
- **Speaker Intelligence Layer**: A speaker behavior profiling architecture. It transforms raw sentiment logs into interactive **Radar** (Emotional Footprint) and **Area** (Sentiment Flow) charts.

## 4. Key Design Decisions & Trade-offs
- **2-Tier LLM Strategy**: Uses `Llama-3.1-8b` for high-volume segmentation and `Llama-3.3-70b` for complex extraction. This balances latency and cost without sacrificing precision on logical pivots.
- **Pinecone Serverless vs. FAISS**: Transitioned to **Pinecone** to support global-scale distribution and multi-tenant namespace isolation. This ensures production-grade scalability and data persistence while maintaining the low-latency retrieval required for real-time querying.
- **Custom RAG vs. Frameworks**: Developed a custom orchestration pipeline instead of LangChain to maintain granular control over **Reranking logic**, **Prompt templates**, and **Diversity Sampling**, avoiding "black box" abstraction overhead.
- **DistilBERT vs. RoBERTa**: Optimized for real-time inference using **DistilBERT**. It offers a 95% performance parity with RoBERTa while significantly reducing compute overhead and latency during per-segment emotion tagging using the **Saravia (2018)** dataset.
- **FastAPI vs. Flask**: Selected FastAPI for native asynchronous support and Pydantic-based validation, critical for managing non-blocking ingestion pipelines.
- **MongoDB vs. PostgreSQL**: Chose MongoDB for its flexible document schema, allowing for the seamless storage of nested meeting metadata and variable-length segments.
- **Next.js vs. React SPA**: Utilized Next.js for its robust server-side optimization and built-in routing, providing a more performant and scalable dashboard than traditional SPAs.
- **MiniLM vs. Larger Embedding Models**: Deployed `all-MiniLM-L6-v2` to achieve sub-millisecond vector retrieval latency while maintaining high precision for short-form dialogue fragments.
- **Secure API Design (POST over GET)**: Transitioned the `/chat` endpoint from `GET` to `POST` to ensure user queries are transmitted securely in the request body. This prevents exposure in server logs, browser history, and proxy layers, aligning with production-grade API security standards.

## 5. End-to-End Data Flow
The system manages a complete lifecycle from raw input to verifiable intelligence. Understanding this flow is the prerequisite for all deep-dive sections that follow:
1. **Upload & Validation**: Client POSTs a transcript; the system validates format (`.vtt`/`.txt`) and initiates a background job, returning a `job_id` immediately.
2. **Segmentation (Map)**: The file is split into token-aware chunks ($2,000$ tokens / $\approx 8,000$ characters); `Llama-3.1-8b` identifies dialogue boundaries and speaker roles per chunk.
3. **Enrichment (Reduce)**: Each unique segment is tagged with sentiment/emotion via **DistilBERT** (Saravia dataset); duplicate segments from overlapping chunks are removed.
4. **Insight Extraction**: `Llama-3.3-70b` synthesizes global decisions and action items from the full set of processed segments.
5. **Vectorization & Indexing**: Segments are embedded via `all-MiniLM-L6-v2` and pushed to **Pinecone** (`prod` namespace); full metadata is committed to **MongoDB Atlas**.
6. **Decision Tracing**: Extracted decisions are vector-searched against the local meeting index to find and persist source "evidence" segments — this happens at ingestion time, not query time.
7. **RAG Query**: User queries are LLM-classified (`FOCUSED`/`GLOBAL`/`SUMMARY`), retrieved from Pinecone, reranked via BGE cross-encoder, diversity-sampled, and synthesized into grounded answers with deep-linked citations.

## 6. Token-Safe Ingestion Pipeline (Map-Reduce)

This pipeline ensures large transcripts are processed safely without exceeding LLM token limits.

Large transcripts are processed using a resilient chunked Map-Reduce strategy to handle hour-long meetings that exceed standard LLM context windows:
- **Recursive Chunking**: Dialogue is split into overlapping, token-safe windows ($2,000$ tokens / $\approx 8,000$ characters) with a 15% overlap to preserve context across boundaries.
- **Parallel Map Phase**: Each chunk is dispatched independently for segmentation under controlled concurrency using `asyncio.Semaphore` to prevent TPM rate-limit errors (HTTP 429) on the Groq API.
- **Reduce Phase**: Chunk results are merged, sorted by `(chunk_index, local_index)`, and deduplicated using normalized-text hashing to produce a clean, chronologically ordered segment list.

## 7. Async Processing & State Management

This asynchronous system manages high-latency ingestion tasks without blocking the user interface.

The platform uses a fully asynchronous job architecture for all high-latency ingestion tasks:
- **`job_id` Lifecycle**: `queued` → `processing` (with stage-level progress updates) → `completed` | `failed` (with diagnostics).
- **Non-Blocking Ingestion**: `BackgroundTasks` in FastAPI allows the client to receive a `job_id` immediately; ingestion proceeds independently of the HTTP request-response cycle.
- **Granular Progress Reporting**: Five specific stages are reported to the polling client: Uploading (0–10%), Segmenting (10–50%, with "Chunk X of Y" messages), Extracting Insights (50–70%), Generating Embeddings (70–90%), and Indexing Data (90–100%).
- **Frontend Sync**: **TanStack Query** handles real-time polling of `/jobs/{id}` and automatically invalidates and refetches the meeting list on completion.

## 8. Diversity-Aware Retrieval Layer

This adaptive pipeline ensures search results are relevant and diverse across multiple meetings.

To address "Single-Meeting Dominance" — where highly relevant results from one meeting crowd out context from others — the system implements an adaptive pipeline:
- **LLM-Based Intent Detection**: `Llama-3.1-8b` classifies queries as **FOCUSED** (local context), **GLOBAL** (multi-meeting trends), or **SUMMARY** (general recap). Results are `lru_cache`d (maxsize=100) to avoid redundant Groq calls for repeated queries.
- **Adaptive Retrieval Depth**:
  - **Focused**: Optimizes for local precision ($15$ candidates $\rightarrow$ token-limited context, up to 1,200 tokens).
  - **Global**: Optimizes for breadth ($30$ candidates $\rightarrow 20$ rerank $\rightarrow$ guaranteed one segment per meeting $\rightarrow$ token-limited context).
- **Diversity Sampling**: In Global mode, results are grouped by `meeting_id`. The top-ranked segment from every meeting is selected first, then remaining budget is filled by score order — ensuring no single session dominates the synthesis.

## 9. Calibrated AI Confidence Scoring

To ensure AI responses are accompanied by interpretable confidence signals:
- **Top-Logit Priority**: The raw logit score of the highest-ranked segment after BGE reranking is used as the confidence signal — not an average, which would dilute strong signals.
- **Sigmoid Normalization**: Raw reranker scores are transformed into a stable 0–100% confidence range using a sigmoid transformation, ensuring interpretable and consistent values for the user.
- **Relevance Threshold**: `RELEVANCE_THRESHOLD = 0.0` — any segment whose BGE logit is negative (sigmoid confidence below 50%) is filtered out before synthesis. This threshold is intentionally permissive to allow semantic inference responses while still removing clearly irrelevant matches.

## 10. Interactive Speaker Intelligence Layer
The system provides a professional-grade behavioral analytics dashboard designed to bridge the gap between aggregate sentiment and raw conversation:
- **Speaker Behavior Profiling (Radar)**: Implements a per-speaker "Emotional Footprint" using Radar charts, comparing the distribution of Agreement, Conflict, Concern, Uncertainty, and Neutral across all participants.
- **Chronological Flow Dynamics (Area)**: Maps the "Emotional Temperature" of the meeting over time using an Area chart, where each data point corresponds to one transcript segment tagged with a DistilBERT emotion label.
- **Dialogue Inspector (Granular Verification)**: Clicking any node on the timeline reveals the segment's exact text, speaker role, and AI confidence score.
- **Deep-Segment Linking**: Every data point preserves its `meeting_id` and `segment_id`, enabling one-click navigation to the full transcript dialogue.

## 11. Failure Modes & System Guarantees
Meetric is designed for **failure-resilient ingestion**:
- **Partial Failure Handling**: If a single chunk fails in the Map-Reduce pipeline, the system skips it and continues, logging the error while salvaging the rest of the file.
- **Malformed LLM Recovery**: A 5-tier recovery system uses **Regex salvage** to fix malformed or truncated JSON outputs.
- **Full Fallback Guarantee**: If all extraction attempts fail, the system generates a **Guaranteed Fallback Segment** to ensure a meeting never exists without accessible transcript data.
- **Source of Truth Integrity**: If vector indexing fails, MongoDB remains the source of truth for the transcript. Meeting deletion is synchronized to ensure vectors are purged alongside metadata; a reconciliation cron-job is planned for production to handle extreme API drift.
- **UI Observability**: In the event of a partial failure, the UI displays a "**Partial Success**" status badge, allowing users to interact with completed data while identifying failed segments via an inline diagnostic alert.

## 12. Edge Case Handling

The following table documents specific edge cases verified in the codebase and the corresponding defensive logic:

| Edge Case | Where It Occurs | Defensive Logic |
|:---|:---|:---|
| **Empty or whitespace-only transcript** | `segmentation_llm_service.py` | `if not text: return []` guard at pipeline entry; upstream validated at upload. |
| **LLM returns malformed or truncated JSON** | `llm_utils.py` | 5-tier `recover_json` pipeline: direct parse → markdown block extraction → structural regex (array) → structural regex (object) → truncated array recovery. |
| **LLM returns valid JSON but wrong schema** | `segmentation_llm_service.py` | `is_valid_segments()` filters any item missing `speaker` or `text` keys before Pydantic validation. |
| **All segmentation chunks fail** | `segmentation_llm_service.py` | `_merge_and_deduplicate` returns empty list → pipeline generates a **Guaranteed Fallback Segment** containing the raw transcript text. |
| **Individual chunk fails (partial pipeline)** | `segmentation_llm_service.py` | `asyncio.gather(*tasks)` with per-chunk `try/except`; failed chunks return `[]` and are silently skipped in the Reduce phase. |
| **DistilBERT input exceeds 512 tokens** | `emotion_service.py` | Text is sliced to `text[:512]` before the pipeline call to enforce the model's hard token limit. |
| **Unmapped emotion label from DistilBERT** | `emotion_service.py` | `map_emotion()` defaults to `"neutral"` for any label not in the `joy/love/fear/sadness/anger/surprise` set — future model updates cannot produce unknown UI categories. |
| **Pinecone not initialized at startup** | `vector_service.py` | All vector functions (`upsert`, `search`, `delete`) guard with `if index is None: return False/[]` before any API call. |
| **MongoDB not connected** | `storage_service.py` | All storage functions check `if collection is None` and raise / return gracefully rather than producing a `NoneType` crash. |
| **Reranker model fails to load** | `reranker_service.py` | Model load is wrapped in `try/except`; `reranker = None` on failure. `rerank()` returns `[]` if `reranker is None`, preventing a crash in the RAG pipeline. |
| **RAG retrieval returns zero results** | `chat.py` | Explicit early-return path returns a structured JSON response with `"confidence": 0.0` and `"sources": []` rather than a 500 error. |
| **All results fail relevance threshold** | `chat.py` | Second early-return path logs the best rejected score for observability and returns a user-friendly "no sufficiently relevant information found" message. |
| **Meeting not found during deletion** | `storage_service.py` | Even if MongoDB reports `deleted_count == 0`, Pinecone cleanup is still attempted to prevent ghost vectors from stale entries. |
| **Decision has no matching evidence in Pinecone** | `upload.py` | `evidence` list defaults to `[]` if `search_vector` returns no matches; `decision_traces` entry is still persisted with an empty evidence array. |
| **Missing `meeting_name` from LLM extraction** | `upload.py` / `storage_service.py` | Falls back to filename-derived title (`filename.rsplit(".", 1)[0].replace("_", " ").title()`); final fallback in MongoDB is `"Untitled Meeting"`. |
| **Action item missing `id`, `status`, or `completed` fields** | `upload.py` | Default `status: "pending"` and `completed: False` are injected for any action item dict missing those keys. |

## 13. Scalability Considerations
The system is built for horizontal expansion:
- **Chunked Scalability**: Handles arbitrarily long transcripts by processing independent segments, with no hard upper bound on transcript length.
- **Vector Retrieval Scaling**: **Pinecone Serverless** provides managed, auto-scaling search as the meeting archive grows, with no infrastructure provisioning required.
- **Bottleneck Management**: Controlled concurrency via `asyncio.Semaphore` prevents TPM (Tokens Per Minute) overload during bulk uploads of long transcripts.
- **Future Improvements**: Planned integration of **Redis** for distributed job state management (replacing in-memory TASKS registry), **Response Streaming** for real-time answer delivery, and a **Bulk Embedding API** for large-scale throughput.

## 14. Key Architectural Trade-off
The most critical architectural trade-off was prioritizing the high-precision reasoning of **Llama-3.3-70B** for extraction and synthesis over cheaper, faster models. This ensures the "Decision Traceability" layer remains objectively verifiable and free of inaccurate or inconsistent outputs — at the cost of higher per-request latency. The 2-tier model strategy (8B for high-volume segmentation, 70B for reasoning) is the direct mitigation: 80% of operations use the fast tier, while only the highest-stakes reasoning steps invoke the 70B model.

## 15. System Impact & Outcomes
This modular and failure-tolerant architecture delivers a reliable intelligence system capable of scaling to enterprise-level meeting archives. By combining high-precision extraction with transparent traceability, Meetric solves the "follow-through gap" while maintaining the data integrity required for high-stakes business environments.
