from fastapi import FastAPI
from app.routes import upload
from app.routes import download
from app.routes import meetings
from app.routes import search
app = FastAPI()

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(meetings.router)
app.include_router(search.router)

