import asyncio
import yaml
import chatglm_cpp
import json

from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


# 定义请求模型
class Message(BaseModel):
    id: int
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    temperature: float
    model: str
    stream: bool


# 初始化 FastAPI 应用
app = FastAPI()

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_model():
    """
    加载模型配置和模型实例
    """
    try:
        with open("config.yaml", "r") as file:
            config = yaml.safe_load(file)

        MODEL_PATH = config["chatglm3"]["path"]
        model = chatglm_cpp.Pipeline(MODEL_PATH)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


# 加载模型
model = load_model()


@app.post("/chat/completions")
async def chat(body: ChatRequest):
    """
    处理聊天请求并生成响应
    """
    if not model:
        raise HTTPException(status_code=500, detail="Model is not loaded")

    messages = body.messages
    select_model = body.model
    temperature = body.temperature / 10
    stream = body.stream
    print(messages, temperature)

    generation_kwargs = dict(temperature=temperature, stream=stream)
    messages = [chatglm_cpp.ChatMessage(role=message.role, content=message.content) for message in messages]

    async def generate_response():
        for message in model.chat(messages, **generation_kwargs):
            json_response = json.dumps({"word": message.content})
            yield json_response
            await asyncio.sleep(0.001) 

    return StreamingResponse(generate_response(), media_type="text/event-stream")
