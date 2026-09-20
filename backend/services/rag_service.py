from services.vector_search_service import search_similar_chunks
from services.llm_service import generate_answer
from services.message_service import get_conversation_messages


def answer_question(
    question: str,
    user_id: str,
    conversation_id: str,
    document_id: str
) -> dict:

    # Step 1: Retrieve relevant document chunks
    results = search_similar_chunks(
        query=question,
        user_id=user_id,
        conversation_id=conversation_id,
        document_id=document_id,
        limit=3
    )

    if not results:
        return {
            "answer": "I could not find the answer in the uploaded document.",
            "sources": []
        }

    # Step 2: Build document context
    context_parts = []

    for result in results:
        context_parts.append(
            f"[Chunk {result['chunk_index']}]\n"
            f"{result['text']}"
        )

    context = "\n\n".join(context_parts)

    # Step 3: Get conversation history
    messages = get_conversation_messages(
        conversation_id=conversation_id,
        user_id=user_id
    )

    # The latest message is the current user question
    previous_messages = messages[:-1]

    # Step 4: Build conversation history
    history_parts = []

    for message in previous_messages:
        history_parts.append(
            f"{message['role'].capitalize()}: "
            f"{message['content']}"
        )

    conversation_history = "\n".join(history_parts)

    # Step 5: Generate answer
    answer = generate_answer(
        question=question,
        context=context,
        conversation_history=conversation_history
    )

    # Step 6: Prepare source information
    sources = [
        {
            "document_id": result["document_id"],
            "document_name": result["document_name"],
            "chunk_index": result["chunk_index"],
            "score": result["score"]
        }
        for result in results
    ]

    return {
        "answer": answer,
        "sources": sources
    }