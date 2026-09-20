from fastapi import APIRouter

from services.message_service import get_conversation_messages


router = APIRouter()


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    user_id: str
):

    return get_conversation_messages(
        conversation_id=conversation_id,
        user_id=user_id
    )