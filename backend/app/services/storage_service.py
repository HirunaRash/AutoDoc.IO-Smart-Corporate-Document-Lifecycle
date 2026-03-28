"""
Storage service — automatically uses local disk when S3 credentials are absent,
so the app works out of the box with zero cloud setup.
"""

import uuid
import os
from pathlib import Path
from app.config import get_settings

settings = get_settings()

# Local uploads folder (created automatically next to main.py)
LOCAL_UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"


def _use_local() -> bool:
    """Return True when S3 credentials are not configured."""
    return not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID.startswith("AKIA...") or settings.AWS_ACCESS_KEY_ID == ""


# ── Local storage ─────────────────────────────────────────────────────────────

def _local_upload(file_content: bytes, original_filename: str) -> dict:
    LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    filename = f"{uuid.uuid4()}.{ext}"
    s3_key = f"local/{filename}"
    path = LOCAL_UPLOAD_DIR / filename
    path.write_bytes(file_content)
    # URL served by FastAPI /files static mount
    return {"s3_key": s3_key, "s3_url": f"/files/{filename}"}


def _local_download(s3_key: str) -> bytes:
    filename = s3_key.replace("local/", "")
    return (LOCAL_UPLOAD_DIR / filename).read_bytes()


def _local_delete(s3_key: str) -> bool:
    try:
        filename = s3_key.replace("local/", "")
        (LOCAL_UPLOAD_DIR / filename).unlink(missing_ok=True)
        return True
    except Exception:
        return False


# ── S3 storage ────────────────────────────────────────────────────────────────

def _get_s3_client():
    import boto3
    kwargs = dict(
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def _s3_upload(file_content: bytes, original_filename: str, content_type: str) -> dict:
    import boto3
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    s3_key = f"documents/{uuid.uuid4()}.{ext}"
    client = _get_s3_client()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        Body=file_content,
        ContentType=content_type,
    )
    if settings.S3_ENDPOINT_URL:
        url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{s3_key}"
    else:
        url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{s3_key}"
    return {"s3_key": s3_key, "s3_url": url}


def _s3_download(s3_key: str) -> bytes:
    client = _get_s3_client()
    response = client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
    return response["Body"].read()


def _s3_delete(s3_key: str) -> bool:
    try:
        from botocore.exceptions import ClientError
        client = _get_s3_client()
        client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
        return True
    except Exception:
        return False


# ── Public API (called by routes / document_service) ─────────────────────────

async def upload_file(file_content: bytes, original_filename: str, content_type: str) -> dict:
    if _use_local():
        return _local_upload(file_content, original_filename)
    return _s3_upload(file_content, original_filename, content_type)


async def download_file(s3_key: str) -> bytes:
    if s3_key.startswith("local/"):
        return _local_download(s3_key)
    return _s3_download(s3_key)


async def delete_file(s3_key: str) -> bool:
    if s3_key.startswith("local/"):
        return _local_delete(s3_key)
    return _s3_delete(s3_key)
