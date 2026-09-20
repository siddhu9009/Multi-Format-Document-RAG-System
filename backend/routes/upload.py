
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from pathlib import Path
from uuid import uuid4

from services.document_processing_service import process_document
from services.embedding_service import create_embeddings
from services.vector_store import store_chunks
from services.auth_dependency import get_current_user
from services.access_service import verify_conversation_access


router = APIRouter()


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    # Verify that the conversation belongs to the logged-in user
    if not verify_conversation_access(
        conversation_id=conversation_id,
        user_id=current_user["user_id"]
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation"
        )

    allowed_types = [".pdf", ".docx"]

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    # Keep only the filename
    filename = Path(file.filename).name

    # Create unique document ID
    document_id = str(uuid4())

    file_path = UPLOAD_DIR / filename

    try:

        # 1. Save uploaded file
        with open(file_path, "wb") as buffer:

            content = await file.read()

            buffer.write(content)

        # 2. Extract text and create chunks
        chunks = process_document(
            str(file_path)
        )

        # 3. Create embeddings
        embeddings = create_embeddings(
            chunks
        )

        # 4. Store chunks + embeddings in MongoDB
        stored_count = store_chunks(
            user_id=current_user["user_id"],
            conversation_id=conversation_id,
            document_id=document_id,
            document_name=filename,
            chunks=chunks,
            embeddings=embeddings
        )

        return {
            "message": "Document processed successfully",
            "document_id": document_id,
            "filename": filename,
            "chunks": len(chunks),
            "stored_chunks": stored_count
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )

