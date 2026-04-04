from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# 🚀 Robust MongoDB connection
try:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),   # ✅ fixes SSL issues
        serverSelectionTimeoutMS=5000  # faster failure
    )

    # 🔥 Force connection test
    client.admin.command("ping")
    print("✅ MongoDB connected successfully")

except Exception as e:
    print("❌ MongoDB connection failed:", e)
    client = None


# 📦 Get DB + collection
if client:
    db = client["meeting_db"]
    collection = db["meetings"]
else:
    db = None
    collection = None