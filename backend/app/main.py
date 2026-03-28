from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.database import init_db
from app.api.routes import auth, documents, search
from app.config import get_settings

settings = get_settings()

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)  # ensure exists before StaticFiles mount


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="AutoDoc.IO API",
    description="Intelligent Corporate Document Lifecycle Management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://192.168.1.17:3000",
        "http://192.168.1.17:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(search.router, prefix="/api")

# Serve locally uploaded files at /files/<filename>
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "storage": "local" if not settings.AWS_ACCESS_KEY_ID else "s3"}
