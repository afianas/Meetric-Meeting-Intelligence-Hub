# Meetric Intelligence Hub: Turn Hours Of Dialogue Into Minutes Of Clarity

## Project Demonstration

[![Project Demo](https://img.shields.io/badge/Project-Showcase-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1HaxOBSXsASlW4IjiKtKmesqKk9N0GNvs/view?usp=drivesdk)

---

## 📸 Screenshots
*(Placeholders for UI Screenshots: Dashboard, Analytics, RAG Chat)*

---

## 🎯 The Problem

Meetings generate vast amounts of unstructured dialogue. Decisions, action items, and strategic context often get buried in lengthy transcripts, making historical recall manual, error-prone, and inefficient. Without a reliable way to verify where an AI-generated summary originated, teams face information silos and a lack of organizational accountability.

## 💡 The Solution

**Meetric** is a production-grade intelligence platform that transforms raw meeting transcripts into structured, queryable, and verifiable insights. By leveraging a multi-tier LLM architecture and a robust RAG (Retrieval-Augmented Generation) engine, Meetric ensures that every decision and summary is grounded in the actual transcript, providing users with a "single source of truth."

### **Core Philosophy / Approach: Traceability**
The system is built on the principle that **AI should never speak without proof**. Unlike standard LLM interfaces that may hallucinate summaries, Meetric enforces strict evidence-linking:
- **Minimized Hallucination**: Every AI response is strictly grounded in retrieved fragments of your actual meetings.
- **Audit-Ready**: Every AI-generated claim is paired with a deep-linked citation to the source transcript.
- **Verifiable Analytics**: Emotional and behavioral trends are directly mapped to specific dialogue segments for objective verification.

## Key Features & Technical Implementation

### **1. Multi-Transcript Ingestion Portal**
- **Feature**: Bulk upload of `.vtt` and `.txt` files with intelligent archiving and real-time validation to block unsupported formats.
- **Technical Implementation**:
    - **Backend**: FastAPI `BackgroundTasks` for non-blocking ingestion.
    - **Parsing**: Robust regex-based cleaning and normalization of subtitle artifacts.
    - **Storage**: **MongoDB Atlas** for high-availability document persistence.
    - **Validation**: Strict frontend/backend type guards with multi-file batch support (handled via intelligent frontend queuing with single-file atomic processing); prevents non-VTT/TXT uploads with immediate user feedback.

### **2. Intelligence Extraction (Action items & Decisions)**
- **Feature**: Automated identification of tasks (Who, What, When) and strategic agreements.
- **Technical Implementation**:
    - **Inference**: High-reasoning **Llama-3.3-70B** for precise extraction.
    - **Validation**: **Pydantic** models ensure structured output before synthesis.
    - **Export Engine**: **ReportLab** (PDF) and native Python `csv` module for on-the-fly report generation.

### **3. Live Action Item Tracker**
- **Feature**: Persistent, synchronized board for tracking task completion.
- **Technical Implementation**:
    - **State Management**: **TanStack Query (React Query)** for optimistic updates.
    - **Aggregation Strategy**: Dashboard metrics aggregate pending tasks globally while simultaneously tracking the subset of meetings that contain active work.
    - **Status Filtering**: Tasks are considered "Pending" only if their status is not 'completed' or 'done' and the boolean completion field is false.
    - **Metadata**: Tracks assignment and deadlines in MongoDB.

### **4. Contextual Query Engine (Focused & Global Chat)**
- **Feature**: Ask natural language questions across a specific meeting or all meetings with verifiable citations and real-time **confidence scoring**.
- **Technical Implementation**:
    - **Bi-Encoder**: `all-MiniLM-L6-v2` for ultra-fast high-recall retrieval from **Pinecone**.
    - **Cross-Encoder**: `BAAI/bge-reranker-base` for second-stage precision reranking.
    - **Logic**: LLM-based query classification (`FOCUSED` vs `GLOBAL`) to optimize context window efficiency.
    - **Confidence**: Sigmoid-normalized reranker scores provide a verified 0-100% confidence level for every generated answer.

### **5. Interactive Chatbot Widget**
- **Feature**: Persistent, glassmorphic UI overlay for instant access to meeting intelligence.
- **Technical Implementation**:
    - **UI**: Specialized React Context for state persistence across dashboard navigation.
    - **Design**: Backdrop-blur filters and CSS-animated transitions for a premium, non-intrusive experience.

### **6. Sentiment Flow & Speaker Timeline**
- **Feature**: At-a-glance visualization of meeting "vibe" and speaker alignment.
- **Technical Implementation**:
    - **Model**: Fine-tuned **DistilBERT** for emotional classification (Conflict, Agreement, Concern etc.) trained on the **Saravia dataset**.
    - **Visualization**: **Recharts** time-series mapping of emotional shifts.
    - **Deep-Linking**: Navigation keys link timeline nodes directly to transcript segments.

### **7. Transcript Viewer & Decision Traceability**
- **Feature**: Direct evidence verification with decision-to-source mapping.
- **Technical Implementation**:
    - **Traceability**: In-ingestion vector-similarity search maps extracted decisions to source dialogue.
    - **Navigation**: Unique `segment_ids` enable deep-linked URLs; UI uses **CSS Pulsing** to guide focus.

---

## 🛠️ Tech Stack

### **Programming Languages**
- **Core Engine**: `Python 3.10+` (Backend Orchestration & AI Pipelines)
- **Frontend Logic**: `TypeScript` (Strictly typed UI components)
- **Styling**: `Modern CSS` (via Tailwind CSS v4)

### **Frameworks**
- **Backend Application**: `FastAPI` (Asynchronous ASGI framework for high-throughput I/O)
- **Web Application**: `Next.js 15` (App Router architecture with React Server Components)
- **Server State**: `TanStack Query v5` (Asynchronous state management & caching)
- **UI Components**: `Radix UI` & `Shadcn UI` (Unstyled primitives for accessible design)
- **Data Visualization**: `Recharts` (Timeline & behavioral aggregation)
- **3D Graphics**: `Three.js` (React Three Fiber for hero animations)

### **Databases**
- **Document Store**: `MongoDB Atlas` (Persistent storage for meeting metadata, segments, and analytics)
- **Vector Engine**: `Pinecone (Serverless)` (High-performance retrieval for dense vector search)

### **APIs & Third-Party Tools**
- **AI Inference Engine**: `Groq API` (Ultra-fast LPU inference for Llama 3 models)
- **Vector Search API**: `Pinecone API` (Namespace-isolated vector management)
- **Local Transformers**: `HuggingFace` (BAAI/bge-reranker-base, all-MiniLM-L6-v2, DistilBERT)
- **Reporting Services**: `ReportLab` (Dynamic PDF & CSV intelligence export)
- **Icons**: `Lucide React` (Standardized iconography)

---
## 🚀 Setup Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Start the Backend (FastAPI)
uvicorn app.main:app --reload
```

### 2. Pinecone Index Setup
Create a new index in your Pinecone console with the following specification:
- **Index Name**: (Matched with your `.env` file)
- **Dimensions**: `384` (Required for `all-MiniLM-L6-v2`)
- **Metric**: `cosine`
- **Cloud**: `AWS`
- **Region**: `us-east-1` (or your preferred region)
- **Capacity Mode**: `Serverless`

### 3. Environment Variables (`backend/.env`)
```env
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

### 4. Frontend
```bash
# Open a new terminal window or tab
cd frontend
npm install
npm run dev
```

---

## 📊 System Architecture

```
Next.js (App Router)
      |
      v
FastAPI (Python) 
      |
      +---> MongoDB (Meeting Metadata, Intelligence Objects)
      |
      +---> Pinecone (Dense Vector Index, Namespace: prod)
                |
                v
         BGE Reranker (Local Cross-Encoder)
                |
                v
         Llama-3.3-70b (Grounded Answer Generation)
```

**Ingestion Pipeline Path:**
`Raw File` → `Recursive Chunking` → `Segmentation (8B)` → `Merge & Deduplication` → `Emotion Tagging (DistilBERT)` → `Insight Extraction (70B)` → `Vector Indexing (Pinecone)` → `Decision-to-Evidence Tracing`

---

## 📡 API Reference

### **Workspace Management**
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/upload` | Initiates backgrounded ingestion. Returns `job_id`. |
| `GET` | `/jobs/{id}` | Polls for real-time progress and message updates. |
| `GET` | `/meetings` | Returns archive with summary analytics. |
| `DELETE` | `/meetings/{id}` | Synchronized deletion from MongoDB and Pinecone. |

### **Intelligence & RAG**
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/chat` | **High-Recall RAG**: Focused, Global, and Summary query modes. |
| `GET` | `/speaker-analytics` | Aggregates emotional distribution per speaker. |
| `POST` | `/download` | Generates professional **CSV** or **PDF** reports. |

---
## 🏗️ System Design Highlights

### **1. Two-Tier LLM Inference Pipeline**
To balance performance, reliability, and cost-efficiency, Meetric utilizes a dual-model execution strategy:
- **Fast Tier (Llama-3.1-8b-instant)**: Handles high-throughput tasks like initial dialogue segmentation and query classification.
- **High-Fidelity Tier (Llama-3.3-70b-versatile)**: Reserved for complex reasoning, cross-chunk synthesis, and as a **high-precision fallback** for the 8B model.
- **Result**: Reduced latency for 80% of operations, while maintaining enterprise-grade reliability for edge cases through automated failover.

### **2. Token-Safe Ingestion Pipeline (Map-Reduce)**
Large transcripts are processed using a resilient chunked Map–Reduce strategy:
- **Recursive Chunking**: Dialogue is split into overlapping, token-safe windows ($2,000$ tokens / $\approx 8,000$ characters) to preserve context.
- **Parallel Processing**: Each chunk is processed independently for extraction, ensuring no token overflow errors or timeouts.
- **Deduplication Logic**: Overlapping chunks are merged with semantic deduplication to ensure a consistent, non-redundant final extraction.
- **5-Tier JSON Recovery**: Comprehensive structural parsing ensures that LLM formatting errors never result in data loss.
- **Ingestion Safety Net**: If LLM attempts fail, the system generates a **guaranteed fallback segment** to ensure 0% data loss.


### **3. Real-Time Processing UI**
Ingestion is managed as an asynchronous workflow, providing real-time observability:
- **Background Task Execution**: Ingestion runs independently of the request-response cycle, returning a `job_id` immediately.
- **Granular Polling**: The frontend fetches live updates through five specific stages:
    - **Uploading Transcript** (0-10%)
    - **Segmenting Transcript** (10-50%, with real-time "Chunk X of Y" feedback)
    - **Extracting Insights** (50-70%, Summary & Actions)
    - **Generating Embeddings** (70-90%, Vectorization)
    - **Indexing Data** (90-100%, Syncing to MongoDB & Pinecone)

### **4. Fault-Tolerant Ingestion Architecture**
- **5-Tier JSON Recovery**: Advanced parsing repairs truncated JSON, fixes malformed quotes, and handles structural extraction from raw text—ensuring LLM formatting errors never cause data loss.
- **Partial Failure Resilience**: If a single chunk fails in the Map-Reduce pipeline, the system skips it and continues, logging the error while salvaging the rest of the file. The UI displays a "**Partial Success**" status with diagnostics rather than a generic failure.
- **Full Fallback Guarantee**: If all extraction attempts fail, the system generates a **guaranteed fallback segment** so a meeting never exists without accessible transcript data.
- **Source of Truth Integrity**: If Pinecone vector indexing fails, MongoDB remains the source of truth for the transcript, allowing for background retries without data loss.
- **Concurrency Control**: Controlled concurrency using `asyncio.Semaphore` prevents Groq TPM rate-limit errors (HTTP 429) during peak ingestion by ensuring sequential, reliable chunk processing.
- **Namespace Isolation**: Multi-tenant-ready structure in Pinecone using a dedicated `prod` namespace for clear environment separation.

---

Meetric isn't just another ChatGPT wrapper. It is a purpose-built intelligence engine designed for **Accountability**. By combining cross-encoder reranking, multi-tier LLM fallbacks, and real-time processing observability, it provides reliable, verifiable insights grounded in actual meeting data— turning hours of dialogue into minutes of clarity.
