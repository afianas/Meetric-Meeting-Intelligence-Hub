from app.db.database import collection
from app.services.embedding_service import get_embedding
from app.services.vector_service import add_vector
from bson import ObjectId

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

def get_meeting_by_id(meeting_id):
    meeting = collection.find_one({"_id": ObjectId(meeting_id)})

    if meeting:
        meeting["_id"] = str(meeting["_id"])

    return meeting

from app.db.database import collection


def add_meeting(data):
    if collection is None:
        raise Exception("MongoDB not connected")

    new_meeting = {
        "analysis": data.get("analysis", {}),
        "segments": data.get("segments", [])
    }

    result = collection.insert_one(new_meeting)
    new_meeting["_id"] = str(result.inserted_id)

    return new_meeting


def get_segments_by_ids(segment_ids):
    results = []

    for meeting in collection.find():
        for seg in meeting.get("segments", []):
            if seg.get("segment_id") in segment_ids:
                seg["meeting_id"] = str(meeting["_id"])
                results.append(seg)

    return results