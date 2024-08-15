import os
import structlog
import pymupdf4llm
from pathlib import Path
from uuid import uuid4
from typing import List, Any

from fastapi.responses import FileResponse
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = structlog.get_logger()

# Configuration constants
ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf"}
UPLOAD_DIRECTORY = Path("uploads")
VECTOR_DB_DIRECTORY = Path("vector_dbs")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# Ensure directories exist
UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
VECTOR_DB_DIRECTORY.mkdir(parents=True, exist_ok=True)

router = APIRouter()
client = QdrantClient(url="http://localhost:6333")
embeddings = OllamaEmbeddings(model="quentinz/bge-large-zh-v1.5")
store = {}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), knowledgeName: str = Form(...), username: str = Form(...)
):
    try:
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File type not allowed")

        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        folder_path = UPLOAD_DIRECTORY / username / knowledgeName
        folder_path.mkdir(parents=True, exist_ok=True)

        file_path = folder_path / file.filename
        if file_path.exists():
            logger.info("file_already_exists", path=str(file_path))
            return {"message": "File already exists", "path": str(file_path)}

        with open(file_path, "wb") as f:
            f.write(file_content)
        logger.info("file_uploaded", path=str(file_path))
        return {"message": "File uploaded successfully", "path": str(file_path)}

    except Exception as e:
        logger.error("upload_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def process_file(
    knowledgeName: str,
    fileName: str,
    maxLength: int,
    overlapLength: int,
    replaceSpaces: bool,
    separator: str,
    username: str,
) -> List[Any]:
    file_path = UPLOAD_DIRECTORY / username / knowledgeName / fileName
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    file_extension = file_path.suffix.lower()

    # 定义不同文件类型的分隔符
    markdown_separators = [
        "\n#{1,6} ",
        "```\n",
        "\n\\*\\*\\*+\n",
        "\n---+\n",
        "\n___+\n",
        "\n\n",
        "\n",
        " ",
        "",
    ]
    text_separators = ["\n\n", "\n", " ", ""]

    if separator:
        markdown_separators.append(separator)
        text_separators.append(separator)

    def get_splitter(separators):
        return RecursiveCharacterTextSplitter(
            chunk_size=maxLength, chunk_overlap=overlapLength, separators=separators
        )

    if file_extension in [".pdf", ".md"]:
        if file_extension == ".pdf":
            content = pymupdf4llm.to_markdown(str(file_path))
        else:
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()

        splitter = get_splitter(markdown_separators)
        docs = splitter.create_documents([content])
    else:
        loader = TextLoader(str(file_path))
        documents = loader.load()

        splitter = get_splitter(text_separators)
        docs = splitter.split_documents(documents)

    if replaceSpaces:
        for doc in docs:
            doc.page_content = (
                doc.page_content.replace("\n", " ").replace("\t", " ").replace("  ", " ")
            )

    return docs


@router.post("/preview-segments")
async def preview_segments(
    knowledgeName: str = Form(...),
    fileName: str = Form(...),
    maxLength: int = Form(...),
    overlapLength: int = Form(...),
    replaceSpaces: bool = Form(...),
    separator: str = Form(...),
    username: str = Form(...),
):
    try:
        logger.info(
            "preview_segments_request",
            knowledge_name=knowledgeName,
            file_name=fileName,
            max_length=maxLength,
            overlap_length=overlapLength,
            replace_spaces=replaceSpaces,
            separator=separator,
            username=username,
        )

        texts = process_file(
            knowledgeName, fileName, maxLength, overlapLength, replaceSpaces, separator, username
        )
        contents = [content.page_content for content in texts]

        logger.info("preview_segments_success", segment_count=len(contents))
        return {"message": "Preview segments successfully", "contents": contents}

    except Exception as e:
        logger.error("preview_segments_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-vector-db")
async def create_vector_db(
    knowledgeName: str = Form(...),
    fileName: str = Form(...),
    maxLength: int = Form(...),
    overlapLength: int = Form(...),
    replaceSpaces: bool = Form(...),
    separator: str = Form(...),
    username: str = Form(...),
):
    try:
        logger.info(
            "create_vector_db_request",
            knowledge_name=knowledgeName,
            file_name=fileName,
            max_length=maxLength,
            overlap_length=overlapLength,
            replace_spaces=replaceSpaces,
            separator=separator,
        )

        collection = f"{username}{knowledgeName}"

        if client.collection_exists(collection):
            vector_store = QdrantVectorStore.from_existing_collection(
                embedding=embeddings,
                collection_name=collection,
            )
            logger.info("vector_db_already_exists")
        else:
            client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
            )

            vector_store = QdrantVectorStore(
                client=client,
                collection_name=collection,
                embedding=embeddings,
            )

        docs = process_file(
            knowledgeName,
            fileName,
            maxLength,
            overlapLength,
            replaceSpaces,
            separator,
            username,
        )

        uuids = [str(uuid4()) for _ in range(len(docs))]
        store[f"{collection}{fileName}"] = uuids
        print(store)
        vector_store.add_documents(docs, ids=uuids)
        return {"message": "Vector DB created successfully"}

    except Exception as e:
        logger.error("create_vector_db_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all-knowledges")
async def get_all_knowledge(username: str = Form(...)):
    try:
        logger.info("get_all_knowledge_request", username=username)
        knowledge_folders = [
            folder.name for folder in (UPLOAD_DIRECTORY / username).iterdir() if folder.is_dir()
        ]
        logger.info("get_all_knowledge_success", knowledge_folders=knowledge_folders)
        return {"message": "All knowledge fetched successfully", "knowledges": knowledge_folders}

    except Exception as e:
        logger.error("get_all_knowledge_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete-knowledge")
async def delete_knowledge(knowledgeName: str = Form(...), username: str = Form(...)):
    try:
        logger.info("delete_knowledge_request", knowledge_name=knowledgeName, username=username)
        knowledge_path = UPLOAD_DIRECTORY / username / knowledgeName
        if not knowledge_path.exists():
            raise HTTPException(status_code=404, detail=f"Knowledge not found: {knowledge_path}")
        for file in knowledge_path.iterdir():
            file.unlink()
        knowledge_path.rmdir()
        client.delete_collection(collection_name=f"{username}{knowledgeName}")
        logger.info("delete_knowledge_success", knowledge_path=str(knowledge_path))
        return {"message": "Knowledge deleted successfully"}

    except Exception as e:
        logger.error("delete_knowledge_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all-files")
async def get_all_files(knowledgeName: str = Form(...), username: str = Form(...)):
    try:
        logger.info("get_all_files_request", knowledge_name=knowledgeName, username=username)
        files = [
            file
            for file in (UPLOAD_DIRECTORY / username / knowledgeName).iterdir()
            if file.is_file()
        ]
        files_dict = [
            {"name": file.name, "size": file.stat().st_size, "time": file.stat().st_mtime}
            for file in files
        ]
        logger.info("get_all_files_success", files=files)
        return {"message": "All files fetched successfully", "files": files_dict}

    except Exception as e:
        logger.error("get_all_files_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete-file")
async def delete_file(
    knowledgeName: str = Form(...), fileName: str = Form(...), username: str = Form(...)
):
    try:
        logger.info(
            "delete_file_request",
            knowledge_name=knowledgeName,
            file_name=fileName,
            username=username,
        )
        file_path = UPLOAD_DIRECTORY / username / knowledgeName / fileName
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        file_path.unlink()

        collection = f"{username}{knowledgeName}"
        vector_store = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            collection_name=collection,
        )
        vector_store.delete(ids=store[f"{collection}{fileName}"])
        logger.info("delete_file_success", file_path=str(file_path))
        return {"message": "File deleted successfully"}

    except Exception as e:
        logger.error("delete_file_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recall")
async def recall(
    selectedKnowledgeName: str = Form(...),
    username: str = Form(...),
    query: str = Form(...),
    index_mode: str = Form(...),
    limit: int = Form(...),
    certainty: float = Form(None),
):
    try:
        logger.info(
            "recall_request",
            knowledge_name=selectedKnowledgeName,
            username=username,
            query=query,
            limit=limit,
            certainty=certainty,
            index_mode=index_mode,
        )

        collection = f"{username}{selectedKnowledgeName}"
        vector_store = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            collection_name=collection,
        )

        if index_mode == "vector":
            found_docs = vector_store.similarity_search_with_score(query, k=limit)
            results = []
            for document, score in found_docs:
                results.append(
                    {
                        "content": document.page_content,
                        "metadata": document.metadata,
                        "score": score,
                    }
                )
        # elif index_mode == "full-text":
        #     response = collection.query.bm25(
        #         query=query, limit=limit, return_metadata=MetadataQuery(score=True)
        #     )
        # elif index_mode == "hybrid":
        #     if certainty is None:
        #         raise HTTPException(
        #             status_code=400, detail="Certainty is required for hybrid search"
        #         )
        #     response = collection.query.hybrid(
        #         query=query, alpha=0.75, return_metadata=MetadataQuery(score=True), limit=limit
        #     )
        else:
            raise HTTPException(status_code=400, detail="Invalid index_mode")

        logger.info("recall_success")
        print(results)
        return {"message": "Recall successful", "results": results}

    except Exception as e:
        logger.error("recall_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/{knowledge_name}/{filename}")
def get_file(knowledge_name: str, filename: str):
    try:
        FILE_DIR = "uploads"
        file_path = os.path.join(FILE_DIR, "admin", knowledge_name, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
