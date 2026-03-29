from fastapi import APIRouter, UploadFile, File
from app.services.storage_service import get_all_meetings, get_meeting, delete_all_meetings, delete_meeting

router = APIRouter()

@router.get("/meetings")
def get_meetings():
    return get_all_meetings()

@router.get("/meetings/{meeting_id}")
def one_meeting(meeting_id: str):
    meeting = get_meeting(meeting_id)

    if not meeting:
        return {"error": "Meeting not found"}

    return meeting

@router.delete("/meetings/all")
def clear_all_meetings():
    """Delete all meetings from the database (used to remove untitled/stale data)."""
    count = delete_all_meetings()
    return {"deleted": count, "message": f"Removed {count} meetings from database."}

@router.delete("/meetings/{meeting_id}")
def remove_meeting(meeting_id: str):
    """Delete a single meeting by ID."""
    success = delete_meeting(meeting_id)
    if success:
        return {"deleted": meeting_id}
    return {"error": "Meeting not found or already deleted"}