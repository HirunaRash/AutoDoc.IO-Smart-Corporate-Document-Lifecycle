from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models.document import DocumentStatus, DocumentCategory


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Document Schemas ──────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    s3_url: Optional[str]
    status: DocumentStatus
    category: Optional[DocumentCategory]
    summary: Optional[str]
    key_topics: Optional[List[str]]
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime]
    processed_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class DocumentList(BaseModel):
    total: int
    items: List[DocumentOut]


# ── Search Schemas ────────────────────────────────────────────────────────────

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    category_filter: Optional[DocumentCategory] = None


class SearchResult(BaseModel):
    document_id: str
    document_name: str
    category: Optional[str]
    score: float
    chunk_text: str
    summary: Optional[str]


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    ai_answer: Optional[str] = None  # RAG-generated answer


# ── Pipeline Status ───────────────────────────────────────────────────────────

class PipelineStatus(BaseModel):
    document_id: str
    status: DocumentStatus
    message: str
    progress: int  # 0-100
