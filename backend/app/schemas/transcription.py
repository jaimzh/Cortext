from pydantic import BaseModel


class TranscriptionResponse(BaseModel):
    message: str
    text: str
