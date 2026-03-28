from fastapi import FastAPI
from app.routes import upload
from app.routes import download
from app.routes import meetings
from app.routes import search
from app.routes import chat
from app.routes import analytics

app = FastAPI()

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(meetings.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(analytics.router)
