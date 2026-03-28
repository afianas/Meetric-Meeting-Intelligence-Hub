from fastapi import APIRouter, UploadFile, File
from app.services.llm_service import extract_action_items
from app.services.storage_service import add_meeting

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")

    result = extract_action_items(text)

    saved = add_meeting(result)

    return {
        "analysis": result,
        "id": saved["_id"]
    }