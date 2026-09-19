from database.connection import db


collection = db["document_chunks"]


def store_chunks(
    document_name: str,
    chunks: list[str],
    embeddings: list[list[float]]
):
    if len(chunks) != len(embeddings):
        raise ValueError("Chunks and embeddings count must be the same")

    documents = []

    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):

        documents.append({
            "document_name": document_name,
            "chunk_index": index,
            "text": chunk,
            "embedding": embedding
        })

    if documents:
        collection.insert_many(documents)

    return len(documents)