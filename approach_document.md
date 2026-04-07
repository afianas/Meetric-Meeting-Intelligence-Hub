# Approach Document: Meetric Intelligence Hub  
*Turn Hours of Dialogue Into Minutes of Clarity*

## 1. Problem Understanding  
Modern professional environments generate massive volumes of unstructured dialogue, yet the process of synthesizing decisions, action items, and conversational tone remains intensely manual. Approaching this problem by simply feeding raw transcripts into standard LLMs fails in production settings due to context window constraints, lack of factual traceability, and frequent hallucination. Extracting actionable, reliable intelligence requires a systematic pipeline that bridges the gap between unstructured speech and structured, verifiable insights.

## 2. Key Challenges Identified  
- **Token Limitations:** Raw transcripts easily exceed stable context windows, causing "Lost in the Middle" syndrome where LLMs forget critical middle-segment dialogue.  
- **Hallucination Risk:** Generative models tend to invent action items or misattribute quotes when summarizing massive documents.  
- **Traceability:** Users lose trust in AI analysis if they cannot instantly trace a claim back to the precise, timestamped source quote.  
- **Scaling Ingestion:** Processing high-volume concurrent text uploads demands aggressive memory management.  

## 3. Solution Design & Architecture  
The Meetric Intelligence Hub is architected deliberately to favor precision and traceability over aggressive summarization, designed as a highly scalable **Retrieval-Augmented Generation (RAG) Map-Reduce Pipeline**.

- **RAG Over Direct Inference:** Instead of relying on an LLM to "memorize" a transcript, Retrieval-Augmented Generation is employed. The LLM is restricted to synthesizing answers strictly from retrieved, high-fidelity vector contexts, minimizing hallucination.  
- **Multi-Model Architecture (8B + 70B):** LLM responsibilities are bifurcated. High-throughput, repetitive tasks (transcript segmentation) are routed to fast 8B models (e.g., Llama-3-8B via Groq), while complex, generative user chat queries are handled by highly accurate 70B parameter models.  
- **Local Reranking Layer:** Vector similarity alone frequently fetches semantically related but contextually irrelevant chunks. A local CrossEncoder (`BAAI/bge-reranker-base`) is injected after initial retrieval as a strict semantic filter, improving the precision of the context sent to the 70B model.  
- **Segmentation + Extraction Separation:** Decoupling the literal parsing of transcripts from metadata extraction (emotion, insights) ensures that an extraction failure does not affect the foundational transcript data.  

## 4. Map-Reduce Pipeline (Implementation Detail)  
The pipeline orchestrates data transformation to guarantee structured outputs:

1. **Upload & Validation:** Next.js handles file validation and initiates a secure payload transfer.  
2. **Chunking & Batching:** Transcripts are split into overlapping, token-safe windows.  
3. **LLM Segmentation (Map-Reduce):** Fast 8B models map unstructured text into strictly typed, timestamped JSON objects.  
4. **Emotion & Tone Tagging:** Specialized classification maps semantic tone (e.g., Agreement, Conflict) to segments.  
5. **Deduplication:** Hash-based checks proactively prevent identical overlaps from bloating the index.  
6. **Insight Extraction:** Critical action items and decisions are procedurally flagged.  
7. **Embedding Generation:** A lightweight local SentenceTransformer (`all-MiniLM-L6-v2`) creates dense semantic vectors.  
8. **Indexing:** Processed objects and their vectors are upserted into Pinecone and MongoDB.  
9. **Semantic Query & Rerank:** User queries trigger vector searches, followed by reranking via the CrossEncoder to surface the most relevant matches.  
10. **Grounded Response Generation:** The 70B model synthesizes the final response using strictly the reranked contexts.  

## 5. Robustness Strategy  
Data parsing is inherently volatile, and LLM failures are expected in edge cases.

- **Pydantic Validation:** Strict static typing filters incorrect payload shapes before reaching the database.  
- **Fall-Through JSON Recovery:** Custom regex-based parsing utilities recover malformed LLM JSON strings (e.g., missing brackets, trailing commas) without interrupting execution.  
- **Partial Failure Handling:** If a single 5-minute chunk fails during processing, the asynchronous batch processor logs the fault and continues execution, successfully processing the remaining transcript.  

*(Detailed edge case handling is documented in the [Design Document](./design_document.md)).*

## 6. Tech Stack & Trade-Off Decisions  
- **2-Tier LLM Strategy:** Uses `Llama-3.1-8b` for high-volume pipeline segmentation and `Llama-3.3-70b` for complex user chat synthesis, balancing latency and cost with precision.  
- **Pinecone Serverless vs. FAISS:** Transitioned from local FAISS to **Pinecone** for global-scale distribution and multi-tenant namespace isolation, ensuring scalability and persistence.  
- **Custom RAG vs. Frameworks (LangChain):** A fully custom orchestration pipeline is implemented instead of relying on LangChain, allowing granular control over reranking logic, prompt templates, and diversity sampling.  
- **DistilBERT vs. RoBERTa:** DistilBERT is used for real-time inference, offering near RoBERTa-level performance with significantly lower latency and compute overhead.  
- **FastAPI vs. Flask:** FastAPI is selected for native asynchronous support and integrated Pydantic validation, critical for non-blocking pipelines.  
- **MongoDB vs. PostgreSQL:** MongoDB is chosen for flexible document storage of nested, unstructured meeting data without rigid schema constraints.  
- **Next.js vs. React SPA:** Next.js provides server-side rendering and optimized routing, improving performance compared to traditional client-side SPAs.  
- **MiniLM vs. Larger Embedding Models:** The `all-MiniLM-L6-v2` model enables fast vector generation while maintaining sufficient semantic quality.  
- **Secure API Design (POST vs. GET):** Query endpoints use POST requests to prevent exposure of sensitive data in logs, caches, or browser history.  

## 7. Scalability Approach  
- **Asynchronous Ingestion:** FastAPI uses asynchronous processing queues, enabling large-scale background processing without blocking HTTP requests.  
- **Rolling Window Chunking:** Fixed overlap chunking (2,000 tokens with 15% overlap) ensures no contextual loss across segments.  
- **Managed Vector DB Scaling:** Pinecone handles vector indexing and retrieval efficiently, maintaining performance regardless of data growth.  

## 8. Future Improvements  
- **Distributed Task Queues:** Introduce Celery + Redis for improved reliability and fault tolerance.  
- **Streaming Responses:** Implement WebSockets for real-time LLM response streaming.  
- **Semantic Deduplication:** Extend duplicate detection to handle paraphrased content.  
- **Improved Reranker Calibration:** Refine CrossEncoder calibration for better confidence scoring.  

## 9. Why This Approach Works  
By decoupling ingestion pipelines from generative logic and grounding responses in reranked vector contexts, this system minimizes hallucination and controls token usage effectively. The result is a stable, traceable, and production-ready intelligence engine.
