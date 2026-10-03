import fitz
from fastapi import UploadFile


async def extract_text_from_pdf(
    file: UploadFile,
) -> str:
    """
    Extract text from a PDF upload.

    Raises:
        ValueError:
            If the file is empty or is not a valid/readable PDF.
    """

    pdf_bytes = await file.read()

    # -----------------------------------------
    # Empty file check
    # -----------------------------------------

    if not pdf_bytes:
        raise ValueError(
            "The uploaded file is empty. Please upload a valid resume PDF."
        )

    # -----------------------------------------
    # Basic PDF signature check
    # -----------------------------------------

    if not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError(
            "The uploaded file is not a valid PDF."
        )

    # -----------------------------------------
    # Open PDF safely
    # -----------------------------------------

    try:
        document = fitz.open(
            stream=pdf_bytes,
            filetype="pdf",
        )

    except Exception as exc:
        raise ValueError(
            "The PDF could not be opened. "
            "It may be corrupted or invalid."
        ) from exc

    # -----------------------------------------
    # Extract text
    # -----------------------------------------

    pages = []

    try:

        for page in document:

            text = page.get_text()

            if text and text.strip():
                pages.append(
                    text.strip()
                )

    finally:

        document.close()

    # -----------------------------------------
    # Empty / image-only PDF
    # -----------------------------------------

    extracted_text = "\n\n".join(pages).strip()

    if not extracted_text:
        raise ValueError(
            "No readable text was found in the PDF. "
            "Please upload a text-based resume PDF."
        )

    # -----------------------------------------
    # Very small / meaningless document
    # -----------------------------------------

    if len(extracted_text) < 80:
        raise ValueError(
            "The PDF does not contain enough readable "
            "resume information. Please upload a complete resume."
        )

    return extracted_text