from typing import List
from pydantic import BaseModel


class Message(BaseModel):
    id: int
    role: str
    content: str


class Chat(BaseModel):
    messages: List[Message]
    temperature: float
    model: str
    stream: bool
