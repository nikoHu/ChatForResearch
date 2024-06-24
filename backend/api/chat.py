import chatglm_cpp
import yaml

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas.chat import Chat

router = APIRouter()


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


@router.post("/completions")
def chat(items: Chat):
    """
    处理聊天请求并生成响应
    """
    if not model:
        raise HTTPException(status_code=500, detail="Model is not loaded")

    messages = items.messages
    select_model = items.model
    temperature = items.temperature / 10
    stream = items.stream

    generation_kwargs = dict(temperature=temperature, stream=stream)
    messages = [chatglm_cpp.ChatMessage(role=message.role, content=message.content) for message in messages]

    def generate_response():
        for message in model.chat(messages, **generation_kwargs):
            yield message.content

    return StreamingResponse(generate_response(), media_type="text/event-stream")
