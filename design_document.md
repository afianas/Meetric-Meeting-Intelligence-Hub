# Design Document: Meeting Intelligence Hub

## 1. Problem Statement
Conventional meetings suffer from a lack of structured follow-through. Discussions are often disconnected from execution, and valuable insights are lost in unstructured transcripts. The absence of automated synthesis creates a traceability gap between a decision made and its corresponding action item, leading to operational inefficiency and information siloing.

## 2. Solution Overview
The Meeting Intelligence Hub is an end-to-end platform designed to transform raw audio transcripts into structured, actionable intelligence.
- **Decision Extraction:** Automated identification of key conclusions and strategic pivots.
- **Action Tracking:** A dedicated execution layer to manage tasks and deadlines derived from dialogue.
- **RAG Chatbot:** A retrieval-augmented generation interface for contextual reasoning across meeting history.
- **Decision Traceability:** An explainability layer mapping decisions back to specific transcript segments.
- **Speaker Sentiment Analysis:** Emotional resonance tracking to identify convergence or friction points.

## 3. System Architecture
The system is partitioned into three functional layers to ensure separation of concerns:
- **Intelligence Layer:** Groq-hosted Llama 3.3 for reasoning, FAISS for vector indexing, and BGE for high-fidelity embeddings.
- **Execution Layer:** A task management system backed by MongoDB for state persistence and metadata tracking.
- **Explainability Layer:** A custom mapping engine that correlates LLM outputs with source segments for auditability.
- **Source Traceability Layer:** A navigation architecture that enables segment-level deep linking from AI responses back to transcript dialogue. It incorporates smooth-scroll positioning, context-aware highlighting (±2 segments), and visual feedback (pulse animations) to ground AI reasoning in verifiable conversation moments.
- **Data Organization Layer:** A mutation-driven UI framework utilizing TanStack Query, enabling dynamic client-side sorting and grouping strategies with real-time synchronization during meeting modifications/deletions.
- **Speaker Intelligence Layer:** A visualization architecture for psychological and behavioral profiling. It transforms raw sentiment logs into interactive Radar (Emotional Footprint) and Area (Sentiment Flow) charts, connected to a real-time Dialogue Inspector for granular verification.

## 4. Action Tracking Logic
The system implements a high-fidelity task management strategy to ensure operational accuracy:
- **Pending vs. Completed Separation:** Tasks are strictly filtered across the data layer. A task is considered "Pending" only if its status is not 'completed' or 'done' and its boolean `completed` field is false.
- **Aggregation Strategy:** Dashboard metrics aggregate pending tasks globally while simultaneously tracking the subset of meetings that contain active work.
- **Real-time Synchronization:** Utilizes TanStack Query's cache invalidation (`queryClient.invalidateQueries(['meetings'])`) to provide instantaneous updates across the dashboard and meeting history whenever a task state is mutated.

### Tech Stack
- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (App Router, Tailwind/Vanilla CSS) with TanStack Query for caching and synchronization
- **Database:** MongoDB (Persistent storage for metadata and segments)
- **Vector Store:** FAISS (Local in-memory indexing for semantic search)
- **Embeddings:** `all-MiniLM-L6-v2` (384-dimension sentence embeddings)
- **Reranker:** `BAAI/bge-reranker-base` (Cross-Encoder for high-precision retrieval)
- **LLM:** Llama 3.3-70B via Groq (For extraction and RAG generation)
- **Emotion Model:** DistilBERT fine-tuned on GoEmotions

## 4. Data Flow
1. **Ingestion:** User uploads transcript (.txt/.vtt).
2. **Extraction:** LLM identifies primary decisions and action items.
3. **Segmentation:** Transcript is partitioned into semantically coherent fragments.
4. **Vectorization:** Segments are embedded via BGE and indexed in FAISS RAM storage.
5. **Persistence:** Metadata and analysis results are committed to MongoDB.
6. **Retrieval:** User queries trigger a hybrid search (semantic + metadata filtration).
7. **Synthesis:** RAG pipeline generates responses based on retrieved context and meeting-specific constraints.

## 5. Key Design Decisions & Trade-offs
- **FAISS vs. Managed Vector DBs:** Chose FAISS for localized, low-latency performance. In scoped environments (10-100k vectors), FAISS provides superior speed and control without the overhead of network-bound managed services.
- **DistilBERT vs. RoBERTa:** Optimized for real-time inference using DistilBERT. It offers a 95% performance parity with RoBERTa while significantly reducing compute requirements.
- **Groq vs. Local LLM Inference:** Selected Groq for ultra-low latency Llama 3.3 execution. This ensures a "near-instant" responsive feel for complex extraction tasks that local inference cannot match on commodity hardware.
- **Custom RAG vs. LangChain:** Developed a custom orchestration pipeline to maintain granular control over reranking logic and prompt templates, avoiding the abstraction overhead and "black box" behavior of third-party frameworks.

## 6. Robustness & Edge Case Handling
- **Resilient Parsing:** Implemented a robust JSON fallback mechanism to handle non-deterministic LLM formatting.
- **Hallucination Mitigation:** Strict context injection ensures the RAG chatbot remains grounded within the provided meeting data.
- **Security Scoping:** Multi-tenant indexing logic prevents cross-meeting data leakage during vector retrieval.
- **Graceful No-Result Handling:** Pre-defined fallback responses for queries with zero semantic overlap.

## 7. Scalability & Future Improvements
- **Horizontal Scaling:** Transition to Pinecone or Milvus for global-scale vector distribution.
- **Performance Optimization:** Integration of Redis for caching frequently accessed retrieval contexts.
- **Asynchronous Tasking:** Implementing Celery/Redis for background processing of large transcript batches.
- **Real-time Ingestion:** Moving from batch uploads to live WebSocket-based streaming and indexing.

## 8. Calibrated AI Confidence Scoring
To ensure that AI responses are accompanied by meaningful and interpretable signals, we implement a custom calibration layer for reranker logits:
- **Top-Logit Signal**: Instead of averaging the similarity scores of all retrieved context segments (which can dilute the signal if some segments are weakly related), we prioritize the score of the top-ranked segment.
- **Scaled Sigmoid Transformation**: We apply a mild scaling factor to the raw logits before passing them through a sigmoid function. This spreads the distribution and ensures that strong semantic matches move quickly towards high confidence values ($>85\%$).
- **Bounded Stretching**: We apply a linear stretching transformation to the resulting probability to remove the "mid-range bias" typical of raw sigmoid outputs, pushing weak matches lower and strong matches higher.
- **Hard Thresholding & Floor/Ceiling**: To maintain UX stability, we apply a hard floor of $5\%$ (to indicate we tried) and a ceiling of $98\%$ (to acknowledge the potential for LLM reasoning errors). Negative top-scores are penalized with a sub-25% cap.

## 9. Diversity-Aware Retrieval Layer
To address the common RAG challenge of "Single-Meeting Dominance," we implement an adaptive, diversity-aware retrieval pipeline:
- **Intent Detection**: The system classifies queries into "Focused" (local context) or "Global" (multi-meeting context) modes. Global mode targets keywords like "across," "trends," and "all meetings."
- **Adaptive Retrieval Parameters**:
  - **Focused**: Optimizes for local precision ($20$ candidates $\rightarrow 10$ context).
  - **Global**: Optimizes for breadth ($50$ candidates $\rightarrow 30$ rerank $\rightarrow 15$ diversity-sampled context).
- **Diversity Sampling Logic**: In global mode, segments are grouped by `meeting_id`. The system ensures at least one top segment from every uniquely found meeting is included in the LLM context, preventing any one meeting from crowding out the summary.
- **Synthesized Prompting**: When multiple meetings are retrieved, the LLM is conditioned with a specialized comparative prompt to identify cross-meeting patterns.

## 11. Interactive Speaker Intelligence Layer
The system provides a professional-grade behavioral analytics dashboard designed to bridge the gap between aggregate sentiment and raw conversation.

- **Psychological Profiling (Radar)**: We implement a per-speaker "Emotional Footprint" using Radar charts. This compares the distribution of Agreement, Conflict, Concern, and Uncertainty across the top three participants, identifying behavioral patterns (e.g., the "Challenger" vs. the "Collaborator").
- **Chronological Flow Dynamics (Area)**: Instead of static percentages, the system maps the "Emotional Temperature" of the meeting over time. Each segment is assigned a numeric value based on its emotion (Agreement: +10, Conflict: -10, Concern: -5, Uncertainty: +5, Neutral: 0) to plot a continuous sentiment Area chart.
- **Dialogue Inspector (Granular Verification)**: The dashboard features a real-time inspector card. Clicking any node on the sentiment flow timeline triggers a state update that reveals the segment's exact text, speaker role, and AI confidence score.
- **Natural Language Insight Generation**: To provide "glanceable" value, the backend includes a rule-based insight engine. It analyzes the final distribution of emotions to produce a 1-line narrative summary (e.g., *"Mostly collaborative with brief technical conflict"*), providing human-readable context to the raw data.
- **Deep-Segment Linking**: Every data point in the intelligence layer preserves its `meeting_id` and `segment_id`, enabling one-click navigation from a behavioral trend directly to the full transcript dialogue.

## 12. Why This Design is Effective
This architecture balances architectural simplicity with high-performance intelligence. By integrating retrieval, reasoning, and execution layers, the system provides more than just a summary—it provides a verifiable, traceable record of organizational momentum. The focus on explainability ensures that every AI-generated insight is grounded in reality, fostering trust and accountability in the decision-making process.
