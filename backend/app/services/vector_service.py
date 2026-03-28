"""
Pinecone Vector Service — stores and queries document chunk embeddings.
Each vector is stored with metadata: document_id, chunk_index, text.
"""

from typing import List, Dict, Any, Optional
from app.config import get_settings

settings = get_settings()

VECTOR_DIMENSION = 1536  # OpenAI text-embedding-3-small / adjust for HF (384 for MiniLM)


def _get_index():
    from pinecone import Pinecone, ServerlessSpec
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)

    existing = [idx.name for idx in pc.list_indexes()]
    if settings.PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=VECTOR_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=settings.PINECONE_ENVIRONMENT),
        )
    return pc.Index(settings.PINECONE_INDEX_NAME)


def upsert_document_chunks(
    document_id: str,
    chunks: List[str],
    embeddings: List[List[float]],
) -> List[str]:
    """Store chunk embeddings in Pinecone. Returns list of vector IDs."""
    index = _get_index()
    vectors = []
    ids = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vec_id = f"{document_id}_{i}"
        vectors.append({
            "id": vec_id,
            "values": embedding,
            "metadata": {
                "document_id": document_id,
                "chunk_index": i,
                "text": chunk[:1000],  # Pinecone metadata size limit
            },
        })
        ids.append(vec_id)

    # Upsert in batches of 100
    batch_size = 100
    for batch_start in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[batch_start:batch_start + batch_size])

    return ids


def search_similar(
    query_embedding: List[float],
    top_k: int = 5,
    filter_document_ids: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Query Pinecone for the most similar chunks."""
    index = _get_index()
    query_kwargs: Dict[str, Any] = {
        "vector": query_embedding,
        "top_k": top_k,
        "include_metadata": True,
    }
    if filter_document_ids:
        query_kwargs["filter"] = {"document_id": {"$in": filter_document_ids}}

    response = index.query(**query_kwargs)
    results = []
    for match in response.matches:
        results.append({
            "id": match.id,
            "score": match.score,
            "document_id": match.metadata.get("document_id"),
            "chunk_index": match.metadata.get("chunk_index"),
            "text": match.metadata.get("text", ""),
        })
    return results


def delete_document_vectors(document_id: str, pinecone_ids: List[str]) -> None:
    """Remove all vectors associated with a document."""
    if not pinecone_ids:
        return
    index = _get_index()
    index.delete(ids=pinecone_ids)
