from typing import List
from pydantic import BaseModel, Field


class Chat(BaseModel):
    mode: str
    username: str
    model: str = Field(default="llama3.1")
    message: str
    temperature: float = Field(default=0.5)
    history_length: int = Field(default=50)


class KnowledgeChat(Chat):
    knowledge_name: str
    mode: str
    username: str
    model: str = Field(default="llama3.1")
    message: str
    temperature: float = Field(default=0.5)
    history_length: int = Field(default=50)


class ResetChat(BaseModel):
    username: str
    mode: str


class HistoryChat(BaseModel):
    username: str
    mode: str
