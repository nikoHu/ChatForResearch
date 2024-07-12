import json
import yaml
import structlog
import chatglm_cpp
from contextlib import contextmanager

from functools import lru_cache
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas.chat import Chat

import weaviate

logger = structlog.get_logger()


@contextmanager
def get_weaviate_client():
    client = weaviate.connect_to_local()
    try:
        yield client
    finally:
        client.close()


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
    is_enable_knowledge = items.is_enable_knowledge
    knowledge_name = items.knowledge_name
    username = items.username
    source = ''
    has_context = False

    def get_system_prompt(context):
        return f"""
        你是一个智能助手。请根据以下上下文信息回答用户的问题:
        ---------------------
        {context}
        ---------------------
        请仔细阅读上述上下文信息, 只在回答与问题直接相关时才使用它。
        不要假设你是上下文中描述的任何人物。
        始终以第三人称回答问题。
        如果上下文信息不足以回答问题,请诚实地说你不知道。
        """

    if is_enable_knowledge:
        with get_weaviate_client() as weaviate_client:
            collection = weaviate_client.collections.get(f"{username}{knowledge_name}")
            query = messages[-1].content

            response = collection.query.near_text(
                query=query,
                limit=5,
            )

            context = "\n".join([obj.properties["text"] for obj in response.objects])
            if response.objects:
                source = response.objects[0].properties.get("source", '')
            has_context = bool(context)
            system_prompt = get_system_prompt(context)
            messages.insert(0, chatglm_cpp.ChatMessage(role="system", content=system_prompt))

    logger.info("User query", query=messages, is_enable_knowledge=is_enable_knowledge)
    generation_kwargs = dict(temperature=temperature, stream=stream)
    messages = [
        chatglm_cpp.ChatMessage(role=message.role, content=message.content) for message in messages
    ]

    def generate_response():
        try:
            answer = ""
            for message in model.chat(messages, **generation_kwargs):
                answer += message.content
                yield json.dumps(
                    {
                        "content": message.content,
                        "has_context": has_context,
                        "source": source,
                    }
                ) + "\n"
            logger.info("Assistant response", response=answer.strip())
        except Exception as e:
            logger.exception("Error generating response", error=str(e))
            yield json.dumps(
                {
                    "content": "I'm sorry, but I encountered an error while generating the response.",
                    "has_context": False,
                    "source": source,
                }
            ) + "\n"

    return StreamingResponse(generate_response(), media_type="text/event-stream")
