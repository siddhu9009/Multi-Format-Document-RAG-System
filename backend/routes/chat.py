from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.rag_service import answer_question
from services.message_service import save_message
from services.auth_dependency import get_current_user
from services.access_service import verify_conversation_access

from services.conversation_service import (
    update_conversation_title,
    is_first_user_message
)


router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    conversation_id: str


@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    # Step 1: Verify conversation ownership
    if not verify_conversation_access(
        conversation_id=request.conversation_id,
        user_id=user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation"
        )

    # Step 2: Check whether this is the first user message
    first_user_message = is_first_user_message(
        conversation_id=request.conversation_id,
        user_id=user_id
    )

    # Step 3: Save user's message
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="user",
        content=request.question
    )

    # Step 4: Create conversation title
    # only for the first user question
    conversation_title = None

    if first_user_message:

        conversation_title = request.question.strip()

        # Keep sidebar title reasonably short
        if len(conversation_title) > 60:
            conversation_title = (
                conversation_title[:60].rstrip()
                + "..."
            )

        update_conversation_title(
            conversation_id=request.conversation_id,
            user_id=user_id,
            title=conversation_title
        )

    # Step 5: Generate RAG answer
    result = answer_question(
        question=request.question,
        user_id=user_id,
        conversation_id=request.conversation_id
    )

    # Step 6: Save assistant response
    save_message(
        conversation_id=request.conversation_id,
        user_id=user_id,
        role="assistant",
        content=result["answer"],
        sources=result.get("sources", [])
    )

    # Step 7: Return updated title when created
    if conversation_title:
        result["conversation_title"] = conversation_title

    return result