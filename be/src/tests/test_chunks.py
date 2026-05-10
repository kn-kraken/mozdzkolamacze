from be.src.chunking import extract_markdown, build_chunks

print("Extracting markdown...")
md = extract_markdown("data/dsa.pdf")
print(f"Markdown length: {len(md)} chars")
print("\nFirst 500 chars:")
print(md[:500])
print("\n---\nBuilding chunks...")
chunks = build_chunks(md)
print(f"Top-level chunks: {len(chunks)}")
for c in chunks[:5]:
    print(f"  [{c['title']}] children: {len(c['children'])}")