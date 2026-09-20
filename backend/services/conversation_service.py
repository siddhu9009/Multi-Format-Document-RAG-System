from datetime import datetime, timezone
from uuid import uuid4

from database.connection import db


conversations_collection = db["conversations"]


def create_conversation(user_id: str, title: str = "New Chat"):

    conversation_id = str(uuid4())

    now = datetime.now(timezone.utc)

    conversation = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }

    conversations_collection.insert_one(conversation)

    return {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }


def get_user_conversations(user_id: str):

    conversations = conversations_collection.find(
        {"user_id": user_id}
    ).sort("updated_at", -1)

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