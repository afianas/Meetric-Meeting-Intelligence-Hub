from fastapi import APIRouter, UploadFile, File
from app.services.storage_service import get_all_meetings
from app.services.storage_service import get_meeting

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