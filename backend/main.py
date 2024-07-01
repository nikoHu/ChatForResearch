from api import chat, knowledge
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import multiprocessing
import uvicorn
import subprocess

app = FastAPI()

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

def run_json_server():
    subprocess.run("json-server ./user_infos/user.json", shell=True)

def run_fastapi():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    json_server = multiprocessing.Process(target=run_json_server)
    fastapi_server = multiprocessing.Process(target=run_fastapi)

    json_server.start()
    fastapi_server.start()

    json_server.join()
    fastapi_server.join()
