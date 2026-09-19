from services.document_service import extract_text
from services.chunk_service import split_text


def process_document(file_path: str) -> list:

    # Step 1: Extract text
    text = extract_text(file_path)

    if not text.strip():
        raise ValueError("No text could be extracted from the document")

    # Step 2: Split text into chunks
    chunks = split_text(text)

    return chunks