import fitz  # PyMuPDF
from pathlib import Path
from dataclasses import dataclass, field

@dataclass
class Chunk:
    title: str
    level: int
    page_start: int
    page_end: int
    elements: list = field(default_factory=list)
    # elements: [{"type": "text", "content": "..."},
    #            {"type": "image", "path": "...", "bbox": [...], "page": N}]


def extract_toc_ranges(doc):
    """Zwraca listę (level, title, start_page, end_page) - 0-indexed, end exclusive."""
    toc = doc.get_toc()  # [[level, title, page_1indexed], ...]
    if not toc:
        raise ValueError("PDF nie ma TOC. Trzeba wykrywać po fontach.")

    ranges = []
    for i, (level, title, page) in enumerate(toc):
        start = page - 1  # to 0-indexed
        # koniec = początek następnego wpisu na tym samym lub wyższym poziomie
        end = doc.page_count
        for j in range(i + 1, len(toc)):
            if toc[j][0] <= level:
                end = toc[j][2] - 1
                break
        ranges.append((level, title, start, end))
    return ranges


def extract_blocks_in_reading_order(page, page_num, image_dir):
    """Zwraca posortowaną listę bloków: tekst i obrazy w kolejności czytania."""
    raw = page.get_text("dict")
    blocks = []

    for block in raw["blocks"]:
        bbox = block["bbox"]  # (x0, y0, x1, y1)

        if block["type"] == 0:  # tekst
            text = "\n".join(
                "".join(span["text"] for span in line["spans"])
                for line in block["lines"]
            ).strip()
            if text:
                blocks.append({
                    "type": "text",
                    "content": text,
                    "bbox": bbox,
                    "page": page_num,
                })

        elif block["type"] == 1:  # obraz
            # zapisz obrazek
            img_bytes = block.get("image")
            if img_bytes:
                ext = block.get("ext", "png")
                img_path = image_dir / f"page{page_num}_y{int(bbox[1])}.{ext}"
                img_path.write_bytes(img_bytes)
                blocks.append({
                    "type": "image",
                    "path": str(img_path),
                    "bbox": bbox,
                    "page": page_num,
                })

    # sortowanie reading order: y najpierw, potem x
    # z tolerancją bo bloki w tej samej linii mają lekko różne y
    blocks.sort(key=lambda b: (round(b["bbox"][1] / 5) * 5, b["bbox"][0]))
    return blocks


def chunk_pdf(pdf_path, output_dir):
    doc = fitz.open(pdf_path)
    output_dir = Path(output_dir)
    image_dir = output_dir / "images"
    image_dir.mkdir(parents=True, exist_ok=True)

    ranges = extract_toc_ranges(doc)
    chunks = []

    for level, title, start, end in ranges:
        chunk = Chunk(title=title, level=level, page_start=start, page_end=end)
        for page_num in range(start, end):
            page = doc[page_num]
            chunk.elements.extend(
                extract_blocks_in_reading_order(page, page_num, image_dir)
            )
        chunks.append(chunk)

    return chunks