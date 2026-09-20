
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from services.conversation_service import (
    create_conversation,
    get_user_conversations
)

from services.auth_dependency import get_current_user


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
