import pymupdf4llm

md = pymupdf4llm.to_markdown(
    "./dsa.pdf",
    embed_images=True,
)
print(md)
pass
