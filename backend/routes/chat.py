from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.rag_service import answer_question
from services.message_service import save_message
from services.auth_dependency import get_current_user
from services.access_service import (
    verify_conversation_access,
    verify_document_access
)

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

    # Step 1: Verify that the conversation belongs to the user
    if not verify_conversation_access(
        conversation_id=request.conversation_id,
        user_id=user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation"
        )

    # Step 2: Verify that the document belongs to
    # this user and this conversation
    if not verify_document_access(
        document_id=request.document_id,
        conversation_id=request.conversation_id,
        user_id=user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this document"
        )

    # Step 3: Save user's message
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="user",
        content=request.question
    )

    # Step 4: Generate RAG answer
    result = answer_question(
        question=request.question,
        user_id=user_id,
        conversation_id=request.conversation_id,
        document_id=request.document_id
    )

    # Step 5: Save assistant's response
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="assistant",
        content=result["answer"],
        sources=result.get("sources", [])
    )

    return result