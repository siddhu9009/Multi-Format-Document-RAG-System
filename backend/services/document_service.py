import csv
import json

from pypdf import PdfReader
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation


def extract_text(file_path: str) -> str:

    file_path_lower = file_path.lower()

    if file_path_lower.endswith(".pdf"):
        return extract_pdf(file_path)

    elif file_path_lower.endswith(".docx"):
        return extract_docx(file_path)

    elif file_path_lower.endswith(".txt"):
        return extract_txt(file_path)

    elif file_path_lower.endswith(".md"):
        return extract_md(file_path)

    elif file_path_lower.endswith(".csv"):
        return extract_csv(file_path)

    elif file_path_lower.endswith(".json"):
        return extract_json(file_path)

    elif file_path_lower.endswith(".xlsx"):
        return extract_xlsx(file_path)

    elif file_path_lower.endswith(".pptx"):
        return extract_pptx(file_path)

    else:
        raise ValueError("Unsupported file type")


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


def extract_txt(file_path: str) -> str:

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()


def extract_md(file_path: str) -> str:

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()


def extract_csv(file_path: str) -> str:

    text = ""

    with open(
        file_path,
        "r",
        encoding="utf-8",
        newline=""
    ) as file:

        reader = csv.reader(file)

        for row in reader:

            text += " | ".join(row) + "\n"

    return text


def extract_json(file_path: str) -> str:

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)

    return json.dumps(
        data,
        indent=2,
        ensure_ascii=False
    )


def extract_xlsx(file_path: str) -> str:

    workbook = load_workbook(
        file_path,
        read_only=True,
        data_only=True
    )

    text = ""

    for sheet in workbook.worksheets:

        text += f"\nSheet: {sheet.title}\n"

        for row in sheet.iter_rows(values_only=True):

            values = []

            for value in row:

                if value is not None:
                    values.append(str(value))

            if values:
                text += " | ".join(values) + "\n"

    workbook.close()

    return text


def extract_pptx(file_path: str) -> str:

    presentation = Presentation(file_path)

    text = ""

    for slide_number, slide in enumerate(
        presentation.slides,
        start=1
    ):

        text += f"\nSlide {slide_number}\n"

        for shape in slide.shapes:

            if hasattr(shape, "text"):

                if shape.text.strip():

                    text += shape.text + "\n"

    return text