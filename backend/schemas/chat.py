from typing import List, Tuple
from pydantic import BaseModel, Field


class Message(BaseModel):
    id: int
    role: str
    content: str


class Chat(BaseModel):
    messages: List[Message]
    temperature: float
    model: str
    stream: bool


class ChatRequest(BaseModel):
    prompt: str
    history: List[Tuple[str, str]] = []
    max_length: int = Field(default=2048, ge=0)
    top_p: float = Field(default=0.7, ge=0, le=1)
    temperature: float = Field(default=0.95, ge=0, le=2)


class ChatResponse(BaseModel):
    response: str
    history: List[Tuple[str, str]]
    status: int
    time: str
