from services.document_service import extract_text

file_path = "uploads/feedback docu.docx"

text = extract_text(file_path)

print(text[:2000])