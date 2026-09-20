from fastapi import APIRouter, Depends

from services.auth_dependency import get_current_user
from services.document_query_service import get_user_documents


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("")
def get_documents(
    current_user: dict = Depends(get_current_user)
):
    return get_user_documents(
        user_id=current_user["user_id"]
    )