from fastapi import APIRouter
from pydantic import BaseModel
from app.db.database import collection
from bson import ObjectId

router = APIRouter()


# ✅ Request body model
class TaskUpdate(BaseModel):
    meeting_id: str
    task_id: int
    status: str


@router.post("/update-task")
def update_task(data: TaskUpdate):
    meeting = collection.find_one({"_id": ObjectId(data.meeting_id)})

    if not meeting:
        return {"error": "Meeting not found"}

    action_items = meeting.get("analysis", {}).get("action_items", [])

    for item in action_items:
        if item.get("id") == data.task_id:
            item["status"] = data.status

    collection.update_one(
        {"_id": ObjectId(data.meeting_id)},
        {"$set": {"analysis.action_items": action_items}}
    )

    return {"message": "Task updated successfully"}