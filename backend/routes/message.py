
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from services.message_service import get_conversation_messages
from services.auth_dependency import get_current_user
from services.access_service import verify_conversation_access


router = APIRouter()


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    # Verify that the conversation belongs to the logged-in user
    if not verify_conversation_access(
        conversation_id=conversation_id,
        user_id=user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation"
        )

    return get_conversation_messages(
        conversation_id=conversation_id,
        user_id=user_id
    )
