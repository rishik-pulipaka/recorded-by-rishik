"""S3 storage for deliverable assets (client galleries, originals).

Active only when S3_BUCKET is configured. Credentials and region come
from the standard AWS env chain (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
AWS_DEFAULT_REGION), which is how the hosting environment is configured.

Uploads/downloads go through presigned URLs, so file bytes never pass
through this API: the client PUTs straight to S3 and later GETs via a
short-lived signed URL.
"""

import re
import uuid

from app.config import settings

KEY_PREFIX = "deliverables"


def s3_enabled() -> bool:
    return bool(settings.S3_BUCKET)


def _client():
    import boto3

    return boto3.client("s3")


def make_key(filename: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", filename).strip("._") or "file"
    return f"{KEY_PREFIX}/{uuid.uuid4()}/{safe}"


def presign_upload(key: str, content_type: str, expires_seconds: int = 900) -> str:
    return _client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_seconds,
    )


def presign_download(key: str, expires_seconds: int = 3600) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key},
        ExpiresIn=expires_seconds,
    )
