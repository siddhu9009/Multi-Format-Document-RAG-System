from datetime import datetime, timezone
from uuid import uuid4

from database.connection import db


conversations_collection = db["conversations"]
messages_collection = db["messages"]
document_chunks_collection = db["document_chunks"]


def create_conversation(
    user_id: str,
    title: str = "New Chat"
):

    conversation_id = str(uuid4())

    now = datetime.now(timezone.utc)

    conversation = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }

    conversations_collection.insert_one(
        conversation
    )

    return {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }


def get_user_conversations(user_id: str):

    conversations = conversations_collection.find(
        {
            "user_id": user_id
        }
    ).sort(
        "updated_at",
        -1
    )

    result = []

    for conversation in conversations:

        result.append({
            "conversation_id": conversation["conversation_id"],
            "user_id": conversation["user_id"],
            "title": conversation["title"],
            "created_at": conversation["created_at"],
            "updated_at": conversation["updated_at"]
        })

    return result


def update_conversation_title(
    conversation_id: str,
    user_id: str,
    title: str
):

    now = datetime.now(timezone.utc)

    result = conversations_collection.update_one(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        },
        {
            "$set": {
                "title": title,
                "updated_at": now
            }
        }
    )

    return result.modified_count > 0


def is_first_user_message(
    conversation_id: str,
    user_id: str
):

    message = messages_collection.find_one(
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user"
        }
    )

    return message is None


def delete_conversation(
    conversation_id: str,
    user_id: str
):

    # Delete messages belonging to this conversation
    messages_collection.delete_many(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    )

    # Delete document chunks belonging to this conversation
    document_chunks_collection.delete_many(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    )

    # Delete the conversation itself
    result = conversations_collection.delete_one(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    )

    return result.deleted_count > 0