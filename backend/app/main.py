from fastapi import FastAPI

from routes.upload import router as upload_router
from routes.chat import router as chat_router


app = FastAPI(
    title="Agentic AI Document Assistant"
)


app.include_router(
    upload_router,
    prefix="/documents",
    tags=["Documents"]
)


app.include_router(
    chat_router,
    tags=["Chat"]
)


@app.get("/health")
def root():
    return {
        "message": "Agentic AI Document Assistant is running"
    }