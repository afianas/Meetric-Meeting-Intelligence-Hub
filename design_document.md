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
- **Data Organization Layer:** A mutation-driven UI framework utilizing TanStack Query, enabling dynamic client-side sorting and grouping strategies with real-time synchronization during meeting modifications/deletions.

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

## 8. Why This Design is Effective
This architecture balances architectural simplicity with high-performance intelligence. By integrating retrieval, reasoning, and execution layers, the system provides more than just a summary—it provides a verifiable, traceable record of organizational momentum. The focus on explainability ensures that every AI-generated insight is grounded in reality, fostering trust and accountability in the decision-making process.
