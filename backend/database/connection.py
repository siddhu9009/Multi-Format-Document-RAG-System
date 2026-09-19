import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000
)

db = client["agentic_ai_db"]

try:
    client.admin.command("ping")
    print("MongoDB connected successfully")

except Exception as e:
    print("MongoDB connection failed:", e)