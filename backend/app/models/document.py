from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum, JSON
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class DocumentCategory(str, enum.Enum):
    LEGAL = "legal"
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    HR = "hr"
    MARKETING = "marketing"
    OPERATIONS = "operations"
    GENERAL = "general"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)          # pdf, docx, txt, etc.
    file_size = Column(Integer, nullable=False)         # bytes
    s3_key = Column(String, nullable=False, unique=True)
    s3_url = Column(String, nullable=True)

    # AI-generated fields (String for SQLite compatibility)
    status = Column(String, default=DocumentStatus.PENDING, nullable=False)
    category = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    key_topics = Column(JSON, nullable=True)            # list of strings
    pinecone_ids = Column(JSON, nullable=True)          # list of chunk vector IDs

    # Metadata
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    owner = relationship("User", back_populates="documents")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)             # uploaded, viewed, searched, deleted
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="audit_logs")
