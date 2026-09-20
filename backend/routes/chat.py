from fastapi import APIRouter, Depends
from pydantic import BaseModel

from services.rag_service import answer_question
from services.message_service import save_message
from services.auth_dependency import get_current_user


router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    conversation_id: str
    document_id: str


@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    # Save user's question
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="user",
        content=request.question
    )

    # Get answer from RAG
    result = answer_question(
        question=request.question,
        user_id=user_id,
        conversation_id=request.conversation_id,
        document_id=request.document_id
    )

    # Save assistant answer
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="assistant",
        content=result["answer"],
        sources=result.get("sources", [])
    )

    return result