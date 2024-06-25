from fastapi import File, UploadFile, HTTPException, APIRouter
from pathlib import Path
import uuid

router = APIRouter()

# 允许的文件类型
ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf"}

# 上传文件保存的目录
UPLOAD_DIRECTORY = Path("uploads")

# 确保上传目录存在
UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 检查文件扩展名
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # 读取文件内容
        file_content = await file.read()

        # 检查文件大小（10MB 限制）
        if len(file_content) > 10 * 1024 * 1024:  # 10MB in bytes
            raise HTTPException(status_code=400, detail="File too large")

        # 生成唯一文件名
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIRECTORY / unique_filename

        # 保存文件
        with file_path.open("wb") as buffer:
            buffer.write(file_content)

    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
