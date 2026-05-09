from pathlib import Path
import pymupdf4llm
print("Zaczynam")

md = pymupdf4llm.to_markdown(
    "progit.pdf",
    embed_images=True
)

Path("progit.md").write_bytes(md.encode())
print("Gotowe!")
