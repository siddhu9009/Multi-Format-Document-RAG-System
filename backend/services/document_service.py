from pypdf import PdfReader
from docx import Document


def extract_text(file_path: str) -> str:

    if file_path.lower().endswith(".pdf"):
        return extract_pdf(file_path)

    elif file_path.lower().endswith(".docx"):
        return extract_docx(file_path)

    else:
        raise ValueError("Only PDF and DOCX files are supported")


def extract_pdf(file_path: str) -> str:

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


def extract_docx(file_path: str) -> str:

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text