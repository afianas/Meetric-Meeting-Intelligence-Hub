from fastapi import APIRouter, UploadFile, File
from app.services.llm_service import extract_action_items

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")

    result = extract_action_items(text)

    return {"analysis": result}