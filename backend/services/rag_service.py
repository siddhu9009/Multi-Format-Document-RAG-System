
from services.vector_search_service import search_similar_chunks
from services.llm_service import generate_answer
from services.message_service import get_conversation_messages


def answer_question(
    question: str,
    user_id: str,
    conversation_id: str
) -> dict:

    # Step 1: Retrieve relevant chunks
    # from all documents in this conversation
    results = search_similar_chunks(
        query=question,
        user_id=user_id,
        conversation_id=conversation_id,
        limit=5
    )

    if not results:
        return {
            "answer": "I could not find the answer in the uploaded documents.",
            "sources": []
        }

    # Step 2: Build document context
    context_parts = []

    for result in results:
        context_parts.append(
            f"[Document: {result['document_name']}]\n"
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

    # Step 6: Prepare unique source information
    sources = []
    seen_documents = set()

    for result in results:
        document_id = result["document_id"]

        # Show each document only once in the frontend
        if document_id in seen_documents:
            continue

        seen_documents.add(document_id)

        sources.append({
            "document_id": document_id,
            "document_name": result["document_name"],
            "chunk_index": result["chunk_index"],
            "score": result["score"]
        })

    return {
        "answer": answer,
        "sources": sources
    }
