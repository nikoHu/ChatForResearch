from pathlib import Path
from fastapi import File, Form, UploadFile, HTTPException, APIRouter
from functools import lru_cache
from contextlib import suppress

import weaviate
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore
import structlog

logger = structlog.get_logger()

# 配置
ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf"}
UPLOAD_DIRECTORY = Path("uploads")
VECTOR_DB_DIRECTORY = Path("vector_dbs")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# 确保目录存在
UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
VECTOR_DB_DIRECTORY.mkdir(parents=True, exist_ok=True)

router = APIRouter()


@lru_cache(maxsize=1)
def get_embedding_model_and_weaviate_clint():
    model_name = "./models/bge-large-zh-v1.5"
    model_kwargs = {"device": "cuda"}
    encode_kwargs = {"normalize_embeddings": True}
    BGEmbedding = HuggingFaceBgeEmbeddings(
        model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
    )
    weaviate_client = weaviate.connect_to_local()

    return BGEmbedding, weaviate_client


BGEmbedding, weaviate_client = get_embedding_model_and_weaviate_clint()


@router.post("/upload")
async def upload_file(file: UploadFile = File(), knowledgeName: str = Form()):
    try:
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File type not allowed")

        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        folder_path = UPLOAD_DIRECTORY / knowledgeName
        with suppress(FileExistsError):
            folder_path.mkdir(parents=True)

        file_path = folder_path / file.filename
        if file_path.exists():
            logger.info("file_already_exists", path=str(file_path))
            return {"message": "File already exists", "path": str(file_path)}

        file_path.write_bytes(file_content)
        logger.info("file_uploaded", path=str(file_path))
        return {"message": "File uploaded successfully", "path": str(file_path)}

    except Exception as e:
        logger.error("upload_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@lru_cache(maxsize=32)
def get_file_content(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def process_file(
    knowledgeName: str, fileName: str, maxLength: int, overlapLength: int, replaceSpaces: bool, separator: str
):
    file_path = UPLOAD_DIRECTORY / knowledgeName / fileName
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    text = get_file_content(str(file_path))
    if replaceSpaces:
        text = text.replace("\n", " ").replace("\t", " ").replace("  ", " ")

    loader = TextLoader(str(file_path))
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=maxLength, chunk_overlap=overlapLength, separators=[separator], add_start_index=True
    )
    texts = text_splitter.split_documents(documents)

    return texts


@router.post("/preview-segments")
async def preview_segments(
    knowledgeName: str = Form(),
    fileName: str = Form(),
    maxLength: int = Form(),
    overlapLength: int = Form(),
    replaceSpaces: bool = Form(),
    separator: str = Form(),
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
        )

        texts = process_file(knowledgeName, fileName, maxLength, overlapLength, replaceSpaces, separator)
        contents = [content.page_content for content in texts]

        logger.info("preview_segments_success", segment_count=len(contents))
        return {"message": "Preview segments successfully", "contents": contents}

    except Exception as e:
        logger.error("preview_segments_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-vector-db")
async def create_vector_db(
    knowledgeName: str = Form(),
    fileName: str = Form(),
    maxLength: int = Form(),
    overlapLength: int = Form(),
    replaceSpaces: bool = Form(),
    separator: str = Form(),
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

        texts = process_file(knowledgeName, fileName, maxLength, overlapLength, replaceSpaces, separator)
        db = WeaviateVectorStore.from_documents(texts, BGEmbedding, client=weaviate_client, index_name=knowledgeName)

        return {"message": "Vector DB created successfully"}

    except Exception as e:
        logger.error("create_vector_db_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
