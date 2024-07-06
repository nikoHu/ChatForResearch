from api import chat, knowledge, user
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

import warnings

warnings.filterwarnings("ignore", category=ResourceWarning, message="unclosed file")


app = FastAPI()


@app.exception_handler(Exception)
async def custom_exception_handler(_, exc):
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder({"detail": str(exc)}),
    )


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
