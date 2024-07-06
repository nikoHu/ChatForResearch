import yaml
import logging
import chatglm_cpp

from functools import lru_cache
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from schemas.chat import Chat, ChatRequest, ChatResponse

router = APIRouter()


@lru_cache(maxsize=1)
def load_model():
    """
    加载模型配置和模型实例
    """
    try:
        with open("config.yaml", "r") as file:
            config = yaml.safe_load(file)

        MODEL_PATH = config["chatglm3"]["path"]
        return chatglm_cpp.Pipeline(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


# 加载模型
model = load_model()


@router.post("/")
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
    messages = [
        chatglm_cpp.ChatMessage(role=message.role, content=message.content) for message in messages
    ]

    def generate_response():
        for message in model.chat(messages, **generation_kwargs):
            yield message.content

    return StreamingResponse(generate_response(), media_type="text/event-stream")


@router.post("/completions")
async def chat(body: ChatRequest) -> ChatResponse:
    messages = []
    for prompt, response in body.history:
        messages += [
            chatglm_cpp.ChatMessage(role="user", content=prompt),
            chatglm_cpp.ChatMessage(role="assistant", content=response),
        ]
    messages.append(chatglm_cpp.ChatMessage(role="user", content=body.prompt))

    output = model.chat(
        messages,
        max_length=body.max_length,
        do_sample=body.temperature > 0,
        top_p=body.top_p,
        temperature=body.temperature,
    )
    history = body.history + [(body.prompt, output.content)]
    answer = ChatResponse(
        response=output.content,
        history=history,
        status=status.HTTP_200_OK,
        time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    logging.info(f'prompt: "{body.prompt}", response: "{output.content}"')
    return answer
