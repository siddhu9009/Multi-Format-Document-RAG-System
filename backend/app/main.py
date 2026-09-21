from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.conversation import router as conversation_router
from routes.message import router as message_router
from routes.auth import router as auth_router
from routes.documents import router as documents_router


app = FastAPI(
    title="Agentic AI Document Assistant"
)


# -------------------------
# CORS
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Routes
# -------------------------

app.include_router(
    upload_router,
    prefix="/documents",
    tags=["Documents"]
)

app.include_router(
    chat_router,
    tags=["Chat"]
)

app.include_router(
    conversation_router,
    tags=["Conversations"]
)

app.include_router(
    message_router,
    tags=["Messages"]
)

app.include_router(
    auth_router
)

app.include_router(
    documents_router
)


@app.get("/health")
def root():

    return {
        "message": "Agentic AI Document Assistant is running"
    }