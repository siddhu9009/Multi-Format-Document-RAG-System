from database.connection import db


conversations_collection = db["conversations"]
document_chunks_collection = db["document_chunks"]


def verify_conversation_access(
    conversation_id: str,
    user_id: str
):
    conversation = conversations_collection.find_one(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    )

    if not conversation:
        return False

    return True


def verify_document_access(
    document_id: str,
    conversation_id: str,
    user_id: str
):
    document = document_chunks_collection.find_one(
        {
            "document_id": document_id,
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    )

    if not document:
        return False

    return True