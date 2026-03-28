from fastapi import FastAPI
from app.routes import upload
from app.routes import download
from app.routes import meetings

app = FastAPI()

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(meetings.router)

