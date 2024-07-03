from fastapi import HTTPException, status, APIRouter
from schemas.user import User
import json

router = APIRouter()


def get_user(username: str):
    with open("./user_infos/user.json", "r") as f:
        users = json.load(f)
    return users.get(username)


@router.post("/login")
async def login(user: User):
    db_user = get_user(user.username)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist",
        )
    if db_user["password"] != user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )
    return {"message": "Login successful"}
