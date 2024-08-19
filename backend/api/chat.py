import json
import structlog
import pymupdf4llm
import yaml
from pathlib import Path
from functools import lru_cache
from typing import Dict, Any

import orjson
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from schemas.chat import Chat, ResetChat, HistoryChat, KnowledgeChat, PdfChat


from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory

UPLOAD_DIRECTORY = Path("uploads")

logger = structlog.get_logger()

router = APIRouter()


# 使用 lru_cache 来缓存配置
@lru_cache()
def read_config(file_path: str) -> Dict[str, Any]:
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


config = read_config("config.yaml")


# 使用 orjson 进行更快的 JSON 序列化
def json_dumps(obj: Any) -> str:
    return orjson.dumps(obj).decode()


# 预加载模型
llm_cache: Dict[tuple, ChatOllama] = {}


def get_llm(model: str, temperature: float) -> ChatOllama:
    key = (model, temperature)
    if key not in llm_cache:
        llm_cache[key] = ChatOllama(model=model, temperature=temperature)
    return llm_cache[key]


store: Dict[str, BaseChatMessageHistory] = {}
store_pdf: Dict[str, str] = {}
embeddings = OllamaEmbeddings(model=config["embedding_model"])


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]


@router.get("/models")
def get_models():
    models = config.get("llm_models", [])
    return {"models": models}


@router.post("/translate")
async def translate(text: str = Form(...)):
    try:
        llm = get_llm("llama3.1", 0.7)
        system_template = "Translate the following into {language}. Don't need to extral explaination."
        prompt = ChatPromptTemplate.from_messages([("system", system_template), ("user", "{text}")])
        chain = prompt | llm | StrOutputParser()
        result = await chain.ainvoke({"language": "chinese", "text": text})
        return {"translation": result}
    except Exception as e:
        logger.error("Translation error", error=str(e), text=text)
        return {"error": f"Translation failed: {str(e)}"}


@router.post("/completions")
async def chat(item: Chat):
    llm = get_llm(item.model, item.temperature / 10)
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage("You are a helpful assistant. Answer all questions to the best of your ability."),
            MessagesPlaceholder(variable_name="chat_history", n_messages=item.history_length),
        ]
    )
    chain = prompt | llm | StrOutputParser()
    with_message_history = RunnableWithMessageHistory(chain, get_session_history)
    config = {"configurable": {"session_id": f"{item.username}-{item.mode}"}}

    async def generate_response():
        async for chunk in with_message_history.astream(HumanMessage(content=item.message), config=config):
            yield json_dumps({"content": chunk, "type": "answer"}) + "\n"

    return StreamingResponse(generate_response(), media_type="text/event-stream")


@router.post("/knowledge-completions")
async def knowledge_chat(item: KnowledgeChat):
    mode = item.mode
    username = item.username
    model = item.model
    message = item.message
    temperature = item.temperature / 10
    history_length = item.history_length
    knowledge_name = item.knowledge_name

    llm = ChatOllama(model=model, temperature=temperature)
    collection = f"{username}{knowledge_name}"
    vector_store = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name=collection,
    )

    retriever = vector_store.as_retriever(search_kwargs={"score_threshold": 0.5, "k": 3})

    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know. Use three sentences maximum and keep the "
        "answer concise."
        "\n\n"
        "{context}"
    )

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history", n_messages=history_length - 2),
            ("human", "{input}"),
        ]
    )
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    config = {"configurable": {"session_id": f"{username}-{mode}"}}
    chain = conversational_rag_chain.pick(["context", "answer"])

    async def generate_response():
        context = ""

        async for chunk in chain.astream({"input": message}, config=config):
            if context_chunk := chunk.get("context"):
                context = context_chunk
            elif answer_chunk := chunk.get("answer"):
                yield json.dumps({"content": answer_chunk, "type": "answer"}) + "\n"

        if context:
            print(context[0].metadata["source"].split("/")[-1])
            yield json.dumps({"content": context[0].metadata["source"].split("/")[-1], "type": "source"}) + "\n"

    return StreamingResponse(generate_response(), media_type="text/event-stream")


@router.post("/pdf-completions")
async def pdf_chat(item: PdfChat):
    mode = item.mode
    username = item.username
    model = item.model
    message = item.message
    filename = item.filename
    temperature = item.temperature / 10
    history_length = item.history_length
    logger.info("Pdf", filename=filename)

    pdf_session_id = f"{username}-{filename}"
    logger.info("Pdf", pdf_session_id=pdf_session_id)
    llm = ChatOllama(model=model, temperature=temperature)

    if pdf_session_id not in store_pdf:
        return JSONResponse(content={"error": "PDF content not found"}, status_code=404)

    pdf_content = store_pdf[pdf_session_id]

    message = f"基于系统消息中提供的 PDF 内容，{message}"

    system_prompt = (
        "You are an AI assistant with access to a specific PDF document. "
        "The entire content of this PDF has been provided to you in this system message. "
        "Your task is to answer questions or provide summaries based solely on the information in this PDF. "
        "Important: Always assume you have the PDF content, even if not explicitly mentioned in the user's question. "
        "If asked to summarize or provide information, use the PDF content without stating that you need to be provided with a PDF. "
        f"PDF Content:\n{pdf_content}\n\n"
        "Now, please respond to the user's questions or requests using only the information from this PDF."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            HumanMessage(content="我们将讨论你已经接收到的 PDF 文档的内容。"),
            MessagesPlaceholder(variable_name="chat_history", n_messages=history_length),
        ]
    )

    chain = prompt | llm | StrOutputParser()

    with_message_history = RunnableWithMessageHistory(chain, get_session_history)
    config = {"configurable": {"session_id": f"{username}-{mode}"}}

    async def generate_response():
        async for chunk in with_message_history.astream(HumanMessage(content=message), config=config):
            yield json.dumps({"content": chunk, "type": "answer"}) + "\n"

    return StreamingResponse(generate_response(), media_type="text/event-stream")


@router.post("/parser-pdf")
async def parser_pdf(file: UploadFile = File(...), username: str = Form(...)):
    try:
        pdf_session_id = f"{username}-{file.filename}"
        if pdf_session_id in store_pdf:
            return JSONResponse(content={"message": "PDF has been parsed."}, status_code=200)

        pdf_path = UPLOAD_DIRECTORY / username / file.filename

        with open(pdf_path, "wb") as buffer:
            buffer.write(await file.read())

        pdf_content = pymupdf4llm.to_markdown(pdf_path)
        pdf_path.unlink()
        store_pdf[pdf_session_id] = pdf_content

        return JSONResponse(content={"message": "PDF has been parsed."}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-chat")
async def reset_chat(item: ResetChat):
    session_id = f"{item.username}-{item.mode}"
    pdf_session_id = f"{item.username}-{item.filename}"
    if session_id in store:
        del store[session_id]
    if pdf_session_id in store_pdf:
        del store_pdf[pdf_session_id]
    return {"message": "Chat history has been reset."}


@router.post("/load-history-chat")
async def load_history_chat(item: HistoryChat):
    session_id = f"{item.username}-{item.mode}"
    if session_id not in store:
        return {"history_chat": []}

    history_chat = []
    for i, message in enumerate(store[session_id].messages):
        if isinstance(message, HumanMessage):
            history_chat.append({"id": i + 1, "role": "user", "content": message.content})
        elif isinstance(message, AIMessage):
            history_chat.append({"id": i + 1, "role": "assistant", "content": message.content})

    return {"history_chat": history_chat}
