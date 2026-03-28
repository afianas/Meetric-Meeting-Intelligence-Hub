from app.db.database import collection
from app.services.embedding_service import get_embedding
from app.services.vector_service import add_vector
from bson import ObjectId


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
    mongo_id = str(result.inserted_id)

    # 🔥 ADD TO FAISS
    add_vector(embedding, mongo_id)

    new_meeting["_id"] = mongo_id

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

def get_meeting_by_id(meeting_id):
    meeting = collection.find_one({"_id": ObjectId(meeting_id)})

    if meeting:
        meeting["_id"] = str(meeting["_id"])

    return meeting