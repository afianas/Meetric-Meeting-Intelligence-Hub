from fastapi import FastAPI
from app.routes import upload
from app.routes import download

app = FastAPI()

app.include_router(upload.router)
app.include_router(download.router)
