from services.vector_search_service import search_similar_chunks
from services.llm_service import generate_answer


def answer_question(question: str) -> dict:

    # Step 1: Retrieve relevant chunks
    results = search_similar_chunks(question, limit=3)

    if not results:
        return {
            "answer": "I could not find the answer in the uploaded document.",
            "sources": []
        }

    # Step 2: Build context from retrieved chunks
    context_parts = []

    for result in results:
        context_parts.append(
            f"[Chunk {result['chunk_index']}]\n"
            f"{result['text']}"
        )

    context = "\n\n".join(context_parts)

    # Step 3: Send retrieved context to Groq
    answer = generate_answer(
        question=question,
        context=context
    )

    # Step 4: Return answer + source information
    sources = [
        {
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