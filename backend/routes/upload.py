from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

from services.document_processing_service import process_document
from services.embedding_service import create_embeddings
from services.vector_store import store_chunks


router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    allowed_types = [".pdf", ".docx"]

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    # Keep only the filename, not any possible path
    filename = Path(file.filename).name

    file_path = UPLOAD_DIR / filename

    try:

        # 1. Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 2. Extract text and create chunks
        chunks = process_document(str(file_path))

        # 3. Create embeddings
        embeddings = create_embeddings(chunks)

        # 4. Store chunks + embeddings in MongoDB
        stored_count = store_chunks(
            filename,
            chunks,
            embeddings
        )

        return {
            "message": "Document processed successfully",
            "filename": filename,
            "chunks": len(chunks),
            "stored_chunks": stored_count
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )