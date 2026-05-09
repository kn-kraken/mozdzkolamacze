import pdfplumber


def extract_text_from_pdf(path: str) -> dict:
    pages = {}
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            pages[i] = page.extract_text() or ""
    full_text = "\n".join(pages.values())
    return {"path": path, "full_text": full_text, "pages": pages}
