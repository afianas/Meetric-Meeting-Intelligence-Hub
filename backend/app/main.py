from fastapi import FastAPI
from app.routes import upload
from app.routes import download
from app.routes import meetings
from app.routes import search
from app.routes import chat
from app.routes import analytics
from app.routes import tasks

app = FastAPI()

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(meetings.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(tasks.router)

from app.services.storage_service import collection
from app.services.vector_service import add_vector, index, id_map

last_load_error = None

@app.on_event("startup")
def load_all_vectors():
    print("Loading existing vectors from MongoDB to FAISS RAM index...")
    if collection is None:
        print("❌ MongoDB collection not found. Skipping vector load.")
        return
    count = 0
    try:
        all_meetings = list(collection.find({}, {"_id": 1, "segments": 1}))
        for meeting in all_meetings:
            m_id = str(meeting["_id"])
            for seg in meeting.get("segments", []):
                if "embedding" in seg and "segment_id" in seg:
                    add_vector(seg["embedding"], seg["segment_id"], m_id)
                    count += 1
        print(f"✅ Successfully loaded {count} vectors into FAISS.")
    except Exception as e:
        print(f"❌ Error loading vectors on startup: {e}")
