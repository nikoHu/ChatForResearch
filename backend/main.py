import httpx
import yaml
import structlog

from contextlib import asynccontextmanager
from api import chat, knowledge, user
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = structlog.get_logger()

def read_config(file_path):
    """
    读取配置文件
    """
    with open(file_path, "r") as file:
        config = yaml.safe_load(file)
    return config


config = read_config("config.yaml")
models = config["llm_models"]
ollama_url = config["ollama_url"]


async def preload_model(model_name, timeout=300):
    """
    预加载模型
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{ollama_url}/api/generate", json={"model": model_name, "keep_alive": -1}
            )
            if response.status_code == 200:
                logger.info(f"Model {model_name} preloaded successfully")
            else:
                logger.error(f"Failed to preload model {model_name}. Status code: {response.status_code}")
    except httpx.TimeoutException:
        logger.warning(f"Timeout while preloading model {model_name}. The model may still be loading.")
    except Exception as e:
        logger.error(f"Error preloading model {model_name}: {str(e)}")


async def unload_model(model_name, timeout=60):
    """
    卸载模型
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{ollama_url}/api/generate", json={"model": model_name, "keep_alive": 0})
            if response.status_code == 200:
                logger.info(f"Model {model_name} unloaded successfully")
            else:
                logger.error(f"Failed to unload model {model_name}. Status code: {response.status_code}")
    except httpx.TimeoutException:
        logger.warning(f"Timeout while unloading model {model_name}.")
    except Exception as e:
        logger.error(f"Error unloading model {model_name}: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时预加载模型
    for model in models:
        await preload_model(model)
    yield
    # 关闭时卸载模型
    for model in models:
        await unload_model(model)


app = FastAPI(lifespan=lifespan)


# CORS 设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(user.router, prefix="/user", tags=["user"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=[".git", "venv", "__pycache__", "*.pyc", "uploads", "vector_dbs"],
    )
