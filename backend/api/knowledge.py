import json
from pathlib import Path
from uuid import UUID
from typing import List, Any
from contextlib import contextmanager

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

import weaviate
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from weaviate.classes.config import Configure, Property, DataType, VectorDistances
from weaviate.classes.query import MetadataQuery, Filter
import structlog

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


@contextmanager
def get_weaviate_client():
    client = weaviate.connect_to_local()
    try:
        yield client
    finally:
        client.close()


class WeaviateJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        return super().default(obj)


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

    loader = TextLoader(str(file_path))
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=maxLength,
        chunk_overlap=overlapLength,
        separators=[separator],
        add_start_index=True,
    )
    texts = text_splitter.split_documents(documents)

    if replaceSpaces:
        for text in texts:
            text.page_content = (
                text.page_content.replace("\n", " ").replace("\t", " ").replace("  ", " ")
            )

    return texts


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

        with get_weaviate_client() as weaviate_client:
            collection_name = f"{username}{knowledgeName}"

            if weaviate_client.collections.exists(collection_name):
                logger.info("vector_db_already_exists")
            else:
                weaviate_client.collections.create(
                    collection_name,
                    properties=[
                        Property(name="text", data_type=DataType.TEXT),
                        Property(name="source", data_type=DataType.TEXT),
                    ],
                    vectorizer_config=Configure.Vectorizer.text2vec_transformers(),
                    vector_index_config=Configure.VectorIndex.hnsw(
                        distance_metric=VectorDistances.COSINE
                    ),
                )

            texts = process_file(
                knowledgeName,
                fileName,
                maxLength,
                overlapLength,
                replaceSpaces,
                separator,
                username,
            )
            texts_obj = [{"text": text.page_content, "source": fileName} for text in texts]
            knowledge = weaviate_client.collections.get(collection_name)
            knowledge.data.insert_many(texts_obj)

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

        with get_weaviate_client() as weaviate_client:
            collection_name = f"{username}{knowledgeName}"
            if weaviate_client.collections.exists(collection_name):
                weaviate_client.collections.delete(collection_name)

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

        with get_weaviate_client() as weaviate_client:
            collection_name = f"{username}{knowledgeName}"
            if weaviate_client.collections.exists(collection_name):
                collection = weaviate_client.collections.get(collection_name)
                collection.data.delete_many(where=Filter.by_property("source").equal(fileName))

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

        with get_weaviate_client() as weaviate_client:
            collection = weaviate_client.collections.get(f"{username}{selectedKnowledgeName}")

            if index_mode == "vector":
                if certainty is None:
                    raise HTTPException(
                        status_code=400, detail="Certainty is required for vector search"
                    )
                response = collection.query.near_text(
                    certainty=certainty,
                    query=query,
                    limit=limit,
                    return_metadata=MetadataQuery(certainty=True),
                )
            elif index_mode == "full-text":
                response = collection.query.bm25(
                    query=query, limit=limit, return_metadata=MetadataQuery(score=True)
                )
            elif index_mode == "hybrid":
                if certainty is None:
                    raise HTTPException(
                        status_code=400, detail="Certainty is required for hybrid search"
                    )
                response = collection.query.hybrid(
                    query=query, alpha=0.75, return_metadata=MetadataQuery(score=True), limit=limit
                )
            else:
                raise HTTPException(status_code=400, detail="Invalid index_mode")

            logger.info("recall_success")
            response_data = json.loads(json.dumps(response.objects, cls=WeaviateJSONEncoder))
        return JSONResponse(content={"message": "Recall success", "query_result": response_data})

    except Exception as e:
        logger.error("recall_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
