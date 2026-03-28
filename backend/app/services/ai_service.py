"""
AI/ML Service — handles:
  1. Text extraction from PDF / DOCX / TXT
  2. Text chunking
  3. Embedding generation (OpenAI or HuggingFace)
  4. Summarization (OpenAI or HuggingFace)
  5. Zero-shot document classification
  6. RAG answer generation
"""

import io
import re
from typing import List, Tuple
from app.config import get_settings

settings = get_settings()

# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text(file_bytes: bytes, file_type: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT bytes."""
    ft = file_type.lower()
    if ft == "pdf":
        return _extract_pdf(file_bytes)
    elif ft in ("docx", "doc"):
        return _extract_docx(file_bytes)
    elif ft == "txt":
        return file_bytes.decode("utf-8", errors="replace")
    else:
        return file_bytes.decode("utf-8", errors="replace")


def _extract_pdf(data: bytes) -> str:
    import pdfplumber
    text_parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n".join(text_parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


# ── Embeddings ────────────────────────────────────────────────────────────────

def get_embeddings(texts: List[str]) -> List[List[float]]:
    if settings.AI_PROVIDER == "openai":
        return _openai_embeddings(texts)
    return _hf_embeddings(texts)


def _openai_embeddings(texts: List[str]) -> List[List[float]]:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(model=settings.OPENAI_EMBED_MODEL, input=texts)
    return [item.embedding for item in response.data]


def _hf_embeddings(texts: List[str]) -> List[List[float]]:
    import requests
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.HF_EMBED_MODEL}"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
    response = requests.post(api_url, headers=headers, json={"inputs": texts, "options": {"wait_for_model": True}})
    response.raise_for_status()
    result = response.json()
    # HF returns nested lists — take mean pooling if needed
    embeddings = []
    for item in result:
        if isinstance(item[0], list):
            # token-level → mean pool
            vec = [sum(t[i] for t in item) / len(item) for i in range(len(item[0]))]
        else:
            vec = item
        embeddings.append(vec)
    return embeddings


# ── Summarization ─────────────────────────────────────────────────────────────

def summarize(text: str, max_length: int = 200) -> str:
    # Trim input to avoid token limits
    trimmed = " ".join(text.split()[:3000])
    if settings.AI_PROVIDER == "openai":
        return _openai_summarize(trimmed, max_length)
    return _hf_summarize(trimmed, max_length)


def _openai_summarize(text: str, max_length: int) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = (
        f"Write a concise executive summary (max {max_length} words) of the following document. "
        f"Focus on the key decisions, findings, or actions described.\n\n{text}"
    )
    response = client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_length * 2,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def _hf_summarize(text: str, max_length: int) -> str:
    import requests
    api_url = f"https://api-inference.huggingface.co/models/{settings.HF_SUMMARIZE_MODEL}"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
    payload = {
        "inputs": text,
        "parameters": {"max_length": max_length, "min_length": 40, "do_sample": False},
        "options": {"wait_for_model": True},
    }
    response = requests.post(api_url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()[0]["summary_text"]


# ── Classification ────────────────────────────────────────────────────────────

CATEGORIES = ["legal", "financial", "technical", "hr", "marketing", "operations", "general"]

def classify_document(text: str) -> Tuple[str, List[str]]:
    """Return (category, key_topics)."""
    trimmed = " ".join(text.split()[:2000])
    if settings.AI_PROVIDER == "openai":
        return _openai_classify(trimmed)
    return _hf_classify(trimmed)


def _openai_classify(text: str) -> Tuple[str, List[str]]:
    from openai import OpenAI
    import json
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = (
        f"Classify this document into exactly ONE of these categories: {', '.join(CATEGORIES)}. "
        f"Also extract 5 key topics/keywords.\n\n"
        f"Respond with valid JSON only: {{\"category\": \"...\", \"topics\": [\"...\", ...]}}\n\n{text}"
    )
    response = client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    category = result.get("category", "general").lower()
    if category not in CATEGORIES:
        category = "general"
    topics = result.get("topics", [])
    return category, topics


def _hf_classify(text: str) -> Tuple[str, List[str]]:
    import requests
    # Zero-shot classification
    api_url = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
    payload = {"inputs": text[:1000], "parameters": {"candidate_labels": CATEGORIES}}
    response = requests.post(api_url, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()
    category = data["labels"][0]
    # Extract topics via simple keyword frequency as fallback
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    stopwords = {"this", "that", "with", "from", "they", "have", "been", "will", "more", "also"}
    freq: dict = {}
    for w in words:
        if w not in stopwords:
            freq[w] = freq.get(w, 0) + 1
    topics = sorted(freq, key=freq.get, reverse=True)[:5]  # type: ignore
    return category, topics


# ── RAG Answer Generation ─────────────────────────────────────────────────────

def generate_rag_answer(query: str, context_chunks: List[str]) -> str:
    """Generate a grounded answer using retrieved chunks as context."""
    if settings.AI_PROVIDER != "openai":
        return "RAG answers require OpenAI provider. Set AI_PROVIDER=openai."
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    context = "\n---\n".join(context_chunks[:5])
    prompt = (
        f"Answer the following question using ONLY the provided document excerpts. "
        f"If the answer is not in the excerpts, say 'Not found in documents.'\n\n"
        f"Question: {query}\n\nDocument Excerpts:\n{context}"
    )
    response = client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512,
    )
    return response.choices[0].message.content.strip()
