
from datetime import datetime, timezone

from database.connection import db


messages_collection = db["messages"]
conversations_collection = db["conversations"]


def update_conversation_timestamp(
    conversation_id: str,
    user_id: str
):
    conversations_collection.update_one(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        },
        {
            "$set": {
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )


def save_message(
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    sources=None
):
    message = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "created_at": datetime.now(timezone.utc)
    }

    result = messages_collection.insert_one(message)

    # Update conversation's last activity time
    update_conversation_timestamp(
        conversation_id=conversation_id,
        user_id=user_id
    )

    return {
        "message_id": str(result.inserted_id),
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "created_at": message["created_at"]
    }


def get_conversation_messages(
    conversation_id: str,
    user_id: str
):

    messages = messages_collection.find(
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        }
    ).sort("created_at", 1)

    result = []

    for message in messages:

        result.append({
            "message_id": str(message["_id"]),
            "conversation_id": message["conversation_id"],
            "user_id": message["user_id"],
            "role": message["role"],
            "content": message["content"],
            "sources": message.get("sources", []),
            "created_at": message["created_at"]
        })

    return result
