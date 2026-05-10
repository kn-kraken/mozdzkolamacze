import pymupdf4llm

md = pymupdf4llm.to_markdown(
    "./data/dsa.pdf",
    embed_images=True,
)
print(md)
pass
