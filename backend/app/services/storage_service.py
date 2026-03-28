from app.db.database import collection
from datetime import datetime
from app.services.embedding_service import get_embedding


def add_meeting(data):
    new_meeting = {
        "analysis": data,
        "created_at": datetime.utcnow()
    }

    result = collection.insert_one(new_meeting)

    new_meeting["_id"] = str(result.inserted_id)

    return new_meeting


def get_all_meetings():
    meetings = list(collection.find())

    for m in meetings:
        m["_id"] = str(m["_id"])

    return meetings


def get_meeting(meeting_id):
    from bson import ObjectId

    meeting = collection.find_one({"_id": ObjectId(meeting_id)})

    if meeting:
        meeting["_id"] = str(meeting["_id"])

    return meeting

def add_meeting(data):
    combined_text = " ".join(data["decisions"]) + " " + " ".join(
        [item["task"] for item in data["action_items"]]
    )

    embedding = get_embedding(combined_text).tolist()

    new_meeting = {
        "analysis": data,
        "embedding": embedding
    }

    result = collection.insert_one(new_meeting)
    new_meeting["_id"] = str(result.inserted_id)

    return new_meeting