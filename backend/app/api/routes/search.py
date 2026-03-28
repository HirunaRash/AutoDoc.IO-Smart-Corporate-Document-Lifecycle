from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.document import Document, AuditLog, DocumentStatus
from app.schemas.document import SearchQuery, SearchResponse, SearchResult
from app.services import ai_service, vector_service
from app.api.deps import get_current_user
from app.models.document import User
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/search", tags=["search"])


def _ai_available() -> bool:
    key = settings.OPENAI_API_KEY or ""
    hf  = settings.HUGGINGFACE_API_KEY or ""
    return (settings.AI_PROVIDER == "openai" and bool(key) and not key.startswith("sk-...")) \
        or (settings.AI_PROVIDER == "huggingface" and bool(hf) and not hf.startswith("hf_..."))


def _pinecone_available() -> bool:
    key = settings.PINECONE_API_KEY or ""
    return bool(key) and not key.startswith("pcsk_...")


def _local_search(query: str, docs: list, top_k: int) -> list:
    """Keyword-based search over document names, summaries, and topics stored in SQLite."""
    terms = [t.lower() for t in query.split() if t.strip()]
    scored = []
    for doc in docs:
        haystack = " ".join(filter(None, [
            doc.original_name,
            doc.summary or "",
            " ".join(doc.key_topics or []),
            doc.category or "",
        ])).lower()

        score = sum(haystack.count(term) for term in terms)
        if score > 0:
            scored.append((score, doc))

    # Sort by score descending, return top_k
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_k]


def _local_rag_answer(query: str, docs: list) -> str:
    """Build a simple answer from matched document summaries."""
    snippets = [
        f"[{doc.original_name}]: {doc.summary}"
        for doc in docs
        if doc.summary
    ]
    if not snippets:
        return "No summaries available. Upload and process documents to enable AI answers."
    context = "\n".join(snippets[:3])
    return f"Based on your documents:\n\n{context}"


@router.post("/", response_model=SearchResponse)
async def semantic_search(
    payload: SearchQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.query.strip():
        raise HTTPException(400, detail="Query cannot be empty")

    # Get all ready documents for this user
    q = select(Document).where(
        Document.owner_id == current_user.id,
        Document.status == DocumentStatus.READY,
    )
    if payload.category_filter:
        q = q.where(Document.category == payload.category_filter)

    result = await db.execute(q)
    user_docs = result.scalars().all()

    if not user_docs:
        return SearchResponse(query=payload.query, results=[], ai_answer="No processed documents found.")

    doc_map = {doc.id: doc for doc in user_docs}
    search_results = []
    context_chunks = []
    ai_answer = None

    if _ai_available() and _pinecone_available():
        # ── Full vector search path ────────────────────────────────────────────
        query_embedding = ai_service.get_embeddings([payload.query])[0]
        matches = vector_service.search_similar(
            query_embedding=query_embedding,
            top_k=payload.top_k,
            filter_document_ids=list(doc_map.keys()),
        )
        for match in matches:
            doc = doc_map.get(match["document_id"])
            if not doc:
                continue
            search_results.append(SearchResult(
                document_id=doc.id,
                document_name=doc.original_name,
                category=doc.category,
                score=round(match["score"], 4),
                chunk_text=match["text"],
                summary=doc.summary,
            ))
            context_chunks.append(match["text"])

        if context_chunks:
            try:
                ai_answer = ai_service.generate_rag_answer(payload.query, context_chunks)
            except Exception:
                ai_answer = "Could not generate AI answer."

    else:
        # ── Local keyword search fallback ──────────────────────────────────────
        scored = _local_search(payload.query, list(user_docs), payload.top_k)
        matched_docs = []
        for score, doc in scored:
            snippet = doc.summary or doc.original_name
            search_results.append(SearchResult(
                document_id=doc.id,
                document_name=doc.original_name,
                category=doc.category,
                score=round(min(score / 10.0, 1.0), 4),  # normalise to 0–1
                chunk_text=snippet,
                summary=doc.summary,
            ))
            matched_docs.append(doc)

        ai_answer = _local_rag_answer(payload.query, matched_docs) if matched_docs else "No matching documents found."

    # Audit log
    db.add(AuditLog(
        document_id=search_results[0].document_id if search_results else user_docs[0].id,
        user_id=current_user.id,
        action="searched",
        details={"query": payload.query, "results_count": len(search_results)},
    ))
    await db.commit()

    return SearchResponse(query=payload.query, results=search_results, ai_answer=ai_answer)
