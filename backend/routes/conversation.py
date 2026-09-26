from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from pydantic import BaseModel

from services.conversation_service import (
    create_conversation,
    get_user_conversations,
    delete_conversation
)

from services.auth_dependency import get_current_user
from services.access_service import verify_conversation_access


router = APIRouter()


class ConversationRequest(BaseModel):
    title: str = "New Chat"


# Create a new conversation
@router.post("/conversations")
def create_new_conversation(
    request: ConversationRequest,
    current_user: dict = Depends(get_current_user)
):

    return create_conversation(
        user_id=current_user["user_id"],
        title=request.title
    )


# Get logged-in user's conversations
@router.get("/conversations")
def get_conversations(
    current_user: dict = Depends(get_current_user)
):

    return get_user_conversations(
        user_id=current_user["user_id"]
    )


# Delete a conversation
@router.delete("/conversations/{conversation_id}")
def delete_user_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    # Verify ownership before deleting anything
    if not verify_conversation_access(
        conversation_id=conversation_id,
        user_id=user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation"
        )

    deleted = delete_conversation(
        conversation_id=conversation_id,
        user_id=user_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id
    }