from app.services.vector_service import add_vector, reset_vectors
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


def delete_all_meetings():
    """Delete every document in the meetings collection and clear vector store."""
    if collection is None:
        raise Exception("MongoDB not connected")
    result = collection.delete_many({})
    reset_vectors() # sync FAISS
    return result.deleted_count


def delete_meeting(meeting_id: str):
    """Delete a single meeting by its ObjectId string. Returns True if deleted."""
    if collection is None:
        raise Exception("MongoDB not connected")
    try:
        result = collection.delete_one({"_id": ObjectId(meeting_id)})
        return result.deleted_count > 0
    except Exception:
        return False


def get_segments_by_ids(segment_ids):
    if not segment_ids:
        return []
    
    results = []
    # Find any meeting containing at least one of these segment IDs
    for meeting in collection.find({"segments.segment_id": {"$in": segment_ids}}):
        m_id = str(meeting["_id"])
        # Fetch title or use truncated ID as fallback to avoid merging unrelated "Unnamed" meetings
        analysis = meeting.get("analysis", {})
        m_title = analysis.get("title") or meeting.get("meeting_title")
        if not m_title or m_title == "Unnamed Meeting":
            m_title = f"Meeting {m_id[-6:].upper()}"
        
        for seg in meeting.get("segments", []):
            if seg.get("segment_id") in segment_ids:
                seg["meeting_id"] = m_id
                seg["meeting_title"] = m_title
                results.append(seg)

    return results