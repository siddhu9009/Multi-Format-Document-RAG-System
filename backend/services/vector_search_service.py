from database.connection import db
from services.embedding_service import create_embedding


collection = db["document_chunks"]


def search_similar_chunks(
    query: str,
    user_id: str,
    conversation_id: str,
    limit: int = 5
):

    query_embedding = create_embedding(query)

    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 50,
                "limit": limit,
                "filter": {
                    "user_id": user_id,
                    "conversation_id": conversation_id
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "document_id": 1,
                "document_name": 1,
                "chunk_index": 1,
                "text": 1,
                "score": {
                    "$meta": "vectorSearchScore"
                }
            }
        }
    ]

    results = collection.aggregate(pipeline)

    return list(results)