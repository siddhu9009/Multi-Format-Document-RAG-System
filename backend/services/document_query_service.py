from database.connection import db


collection = db["document_chunks"]


def get_user_documents(user_id: str):
    pipeline = [
        {
            "$match": {
                "user_id": user_id
            }
        },
        {
            "$group": {
                "_id": "$document_id",
                "document_name": {
                    "$first": "$document_name"
                },
                "conversation_id": {
                    "$first": "$conversation_id"
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "document_id": "$_id",
                "document_name": 1,
                "conversation_id": 1
            }
        }
    ]

    documents = collection.aggregate(pipeline)

    return list(documents)