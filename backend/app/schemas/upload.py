from pydantic import BaseModel


class PresignRequest(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"


class PresignResponse(BaseModel):
    key: str
    upload_url: str
    expires_in: int
