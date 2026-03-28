"""
Document Service — orchestrates the full ML pipeline:
  1. Download from storage (local or S3)
  2. Extract text
  3. Chunk → Embed → Pinecone   (skipped if AI keys not set)
  4. Summarize                   (skipped if AI keys not set)
  5. Classify                    (skipped if AI keys not set)
  6. Update DB record

AI steps are optional: document is marked READY even without them,
so the app works fully without any API keys configured.
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document, DocumentStatus
from app.services import ai_service, storage_service
from app.config import get_settings

settings = get_settings()


def _ai_available() -> bool:
    """True only when a real AI API key is present."""
    key = settings.OPENAI_API_KEY or ""
    hf  = settings.HUGGINGFACE_API_KEY or ""
    return (settings.AI_PROVIDER == "openai" and bool(key) and not key.startswith("sk-...")) \
        or (settings.AI_PROVIDER == "huggingface" and bool(hf) and not hf.startswith("hf_..."))


def _pinecone_available() -> bool:
    key = settings.PINECONE_API_KEY or ""
    return bool(key) and not key.startswith("pcsk_...")


async def process_document(document_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    try:
        doc.status = DocumentStatus.PROCESSING
        await db.commit()

        # ── 1. Download ────────────────────────────────────────────────────────
        file_bytes = await storage_service.download_file(doc.s3_key)

        # ── 2. Extract text ────────────────────────────────────────────────────
        text = ai_service.extract_text(file_bytes, doc.file_type)
        if not text.strip():
            raise ValueError("Could not extract any text from this document.")

        # ── 3–5. AI features (optional) ────────────────────────────────────────
        pinecone_ids = []
        summary      = None
        category     = "general"
        topics: list = []

        if _ai_available():
            # Chunk + embed
            chunks = ai_service.chunk_text(text)

            if _pinecone_available():
                from app.services import vector_service
                embeddings   = ai_service.get_embeddings(chunks)
                pinecone_ids = vector_service.upsert_document_chunks(document_id, chunks, embeddings)
            else:
                # Still generate embeddings to get summary/classify but skip Pinecone
                pass

            summary           = ai_service.summarize(text)
            category, topics  = ai_service.classify_document(text)
        else:
            # No AI key — do basic keyword classification as fallback
            text_lower = text.lower()
            if any(w in text_lower for w in ["contract", "legal", "agreement", "clause", "plaintiff"]):
                category = "legal"
            elif any(w in text_lower for w in ["revenue", "profit", "financial", "budget", "invoice"]):
                category = "financial"
            elif any(w in text_lower for w in ["employee", "hiring", "hr", "onboard", "payroll"]):
                category = "hr"
            elif any(w in text_lower for w in ["code", "api", "software", "system", "technical"]):
                category = "technical"
            else:
                category = "general"

            # Basic excerpt as placeholder summary
            words   = text.split()
            summary = " ".join(words[:60]) + ("…" if len(words) > 60 else "")

        # ── 6. Persist ─────────────────────────────────────────────────────────
        doc.status       = DocumentStatus.READY
        doc.summary      = summary
        doc.category     = category
        doc.key_topics   = topics
        doc.pinecone_ids = pinecone_ids
        doc.processed_at = datetime.now(timezone.utc)
        await db.commit()

    except Exception as exc:
        doc.status        = DocumentStatus.FAILED
        doc.error_message = str(exc)
        await db.commit()
        raise
