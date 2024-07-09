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
    is_enable_knowledge: bool
    knowledge_name: str
    username: str
