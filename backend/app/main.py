import os
import sys
import logging
import certifi
from dotenv import load_dotenv

# 🚀 1. Centralized Environment & Logging
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app.main")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, download, meetings, search, chat, analytics, tasks, jobs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(meetings.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(tasks.router)
app.include_router(jobs.router)

from app.services.storage_service import collection
from app.services.vector_service import index

last_load_error = None

@app.on_event("startup")
def verify_connections():
    logger.info("Verifying service connections...")
    
    # Verify Pinecone
    if index is None:
        logger.error("❌ CRITICAL: Pinecone initialization failed. Check PINECONE_API_KEY and PINECONE_INDEX_NAME.")
        sys.exit(1)
    
    try:
        stats = index.describe_index_stats()
        logger.info(f"✅ Connected to Pinecone. Index stats: {stats}")
    except Exception as e:
        logger.error(f"❌ CRITICAL: Could not connect to Pinecone index: {e}")
        sys.exit(1)

    # Verify MongoDB
    if collection is None:
        logger.error("❌ CRITICAL: MongoDB collection not found.")
        sys.exit(1)
    
    logger.info("✅ All systems ready.")
