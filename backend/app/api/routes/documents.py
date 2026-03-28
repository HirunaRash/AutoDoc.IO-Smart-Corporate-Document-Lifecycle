import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.document import Document, AuditLog, DocumentStatus
from app.schemas.document import DocumentOut, DocumentList, PipelineStatus
from app.services import storage_service, document_service
from app.api.deps import get_current_user
from app.models.document import User

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"pdf", "docx", "doc", "txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"File type .{ext} not supported. Allowed: {ALLOWED_TYPES}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, detail="File exceeds 20 MB limit")

    # Upload to S3
    s3_info = await storage_service.upload_file(file_bytes, file.filename, file.content_type or "application/octet-stream")

    # Create DB record
    doc = Document(
        filename=s3_info["s3_key"].rsplit("/", 1)[-1],
        original_name=file.filename,
        file_type=ext,
        file_size=len(file_bytes),
        s3_key=s3_info["s3_key"],
        s3_url=s3_info["s3_url"],
        status=DocumentStatus.PENDING,
        owner_id=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Audit log
    db.add(AuditLog(document_id=doc.id, user_id=current_user.id, action="uploaded"))
    await db.commit()

    # Kick off background ML pipeline
    background_tasks.add_task(_run_pipeline, doc.id)

    return doc


async def _run_pipeline(document_id: str):
    """Run in background — needs its own DB session."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await document_service.process_document(document_id, db)


@router.get("/", response_model=DocumentList)
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.owner_id == current_user.id)
    )
    total = total_result.scalar()

    result = await db.execute(
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    return DocumentList(total=total, items=list(items))


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, detail="Document not found")

    db.add(AuditLog(document_id=doc.id, user_id=current_user.id, action="viewed"))
    await db.commit()
    return doc


@router.get("/{document_id}/status", response_model=PipelineStatus)
async def get_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, detail="Document not found")

    progress_map = {
        DocumentStatus.PENDING: 0,
        DocumentStatus.PROCESSING: 50,
        DocumentStatus.READY: 100,
        DocumentStatus.FAILED: 0,
    }
    msg_map = {
        DocumentStatus.PENDING: "Queued for processing",
        DocumentStatus.PROCESSING: "Extracting text, generating embeddings...",
        DocumentStatus.READY: "Processing complete",
        DocumentStatus.FAILED: doc.error_message or "Processing failed",
    }
    return PipelineStatus(
        document_id=doc.id,
        status=doc.status,
        message=msg_map[doc.status],
        progress=progress_map[doc.status],
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, detail="Document not found")

    # Delete from S3
    await storage_service.delete_file(doc.s3_key)

    # Delete from Pinecone
    if doc.pinecone_ids:
        from app.services import vector_service
        vector_service.delete_document_vectors(doc.id, doc.pinecone_ids)

    await db.delete(doc)
    await db.commit()
