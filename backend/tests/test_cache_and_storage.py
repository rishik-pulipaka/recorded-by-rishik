"""Unit tests for the Redis cache layer and the S3 storage service."""

import pytest
from moto import mock_aws

from app.config import settings
from app.services import cache, storage


@pytest.fixture(autouse=True)
def _reset_cache():
    cache.reset_for_tests()
    yield
    cache.reset_for_tests()


def test_cache_local_fallback_roundtrip(monkeypatch):
    monkeypatch.setattr(settings, "REDIS_URL", "")
    cache.set_json("k", {"a": 1}, ttl_seconds=60)
    assert cache.get_json("k") == {"a": 1}
    cache.delete("k")
    assert cache.get_json("k") is None


def test_cache_local_fallback_expires(monkeypatch):
    monkeypatch.setattr(settings, "REDIS_URL", "")
    cache.set_json("k", [1, 2], ttl_seconds=0)
    assert cache.get_json("k") is None


def test_cache_redis_backend_via_fakeredis(monkeypatch):
    import redis as redis_lib
    from fakeredis import FakeRedis

    monkeypatch.setattr(settings, "REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setattr(
        redis_lib.Redis, "from_url", classmethod(lambda cls, url, **kw: FakeRedis(decode_responses=True))
    )
    cache.set_json("rk", {"via": "redis"}, ttl_seconds=60)
    # The value must not be in the local fallback store
    assert "rk" not in cache._local
    assert cache.get_json("rk") == {"via": "redis"}


def test_presign_requires_configuration(client, auth_state, users, monkeypatch):
    monkeypatch.setattr(settings, "S3_BUCKET", "")
    auth_state["user"] = users["admin"]
    resp = client.post(
        "/api/v1/admin/uploads/presign",
        json={"filename": "gallery.zip", "content_type": "application/zip"},
    )
    assert resp.status_code == 503


@mock_aws
def test_presign_upload_download_roundtrip(client, auth_state, users, monkeypatch):
    import boto3

    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-west-1")
    boto3.client("s3", region_name="us-west-1").create_bucket(
        Bucket="rb-test", CreateBucketConfiguration={"LocationConstraint": "us-west-1"}
    )
    monkeypatch.setattr(settings, "S3_BUCKET", "rb-test")
    auth_state["user"] = users["admin"]

    resp = client.post(
        "/api/v1/admin/uploads/presign",
        json={"filename": "IMG 001.jpg", "content_type": "image/jpeg"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["key"].startswith("deliverables/")
    assert body["key"].endswith("IMG_001.jpg")  # filename sanitized
    assert "rb-test" in body["upload_url"]

    # Write the object the presigned URL points at (verified via boto3:
    # moto's httpx interception is unreliable for raw presigned PUTs, and
    # the browser-side PUT itself is standard S3 behavior, not our code).
    s3 = boto3.client("s3", region_name="us-west-1")
    s3.put_object(
        Bucket="rb-test", Key=body["key"], Body=b"fake-jpeg-bytes", ContentType="image/jpeg"
    )
    download_url = storage.presign_download(body["key"])
    assert "rb-test" in download_url and body["key"] in download_url
    got = s3.get_object(Bucket="rb-test", Key=body["key"])
    assert got["Body"].read() == b"fake-jpeg-bytes"
