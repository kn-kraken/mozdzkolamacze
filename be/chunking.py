import json
import os
import uuid

import pymupdf4llm
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_text_splitters import MarkdownHeaderTextSplitter

load_dotenv()

_FILTER_PROMPT = """You are filtering sections of a technical book for a learning tool.

Decide which sections contain SUBSTANTIVE LEARNING CONTENT that a student needs to read.

KEEP: chapters, sections explaining concepts, algorithms, data structures, examples, exercises.
SKIP: prefaces, acknowledgements, author bios, copyright notices, table of contents, dedications, colophons, "about this book" sections.

Return ONLY a JSON array of indices (0-based) to keep. No explanation, no markdown — just the array.
Example: [0, 2, 3, 5]"""

_EVAL_PROMPT = """You are evaluating a student's summary of a technical book section.

You will receive the original section content and the student's summary.
Decide if the summary correctly captures the key concepts.

If the summary is correct and complete enough: respond with exactly: OK
If the summary is missing something important or is wrong: respond with a short hint in the same language as the summary (1-2 sentences, start with what is missing or wrong). Do not give away the answer — just hint."""


def _llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_KEY"),
    )


def extract_markdown(path: str) -> str:
    return pymupdf4llm.to_markdown(path, embed_images=True)


def build_chunks(md: str) -> list[dict]:
    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")],
    )
    raw = splitter.split_text(md)
    chunks = _to_hierarchy(raw)
    return _filter_with_llm(chunks)


def evaluate_summary(chunk_content: str, summary: str) -> str | None:
    """Returns None if OK, or a hint string if the summary is insufficient."""
    response = _llm().invoke([
        SystemMessage(content=_EVAL_PROMPT),
        HumanMessage(content=f"Section content:\n{chunk_content}\n\nStudent summary:\n{summary}"),
    ])
    result = response.content.strip()
    return None if result == "OK" else result


def _to_hierarchy(raw_chunks) -> list[dict]:
    sections: dict[str, dict] = {}
    result: list[dict] = []

    for chunk in raw_chunks:
        meta = chunk.metadata
        h1, h2 = meta.get("h1"), meta.get("h2")

        if not h1:
            continue

        if h1 not in sections:
            node: dict = {
                "id": str(uuid.uuid4()),
                "title": h1,
                "content": chunk.page_content if not h2 else "",
                "children": [],
            }
            sections[h1] = node
            result.append(node)

        if h2:
            child: dict = {
                "id": str(uuid.uuid4()),
                "title": h2,
                "content": chunk.page_content,
                "children": [],
            }
            sections[h1]["children"].append(child)

    if len(result) <= 2:
        promoted = [child for node in result for child in node["children"]]
        result = promoted if promoted else result

    return result


def _filter_with_llm(chunks: list[dict]) -> list[dict]:
    if not chunks:
        return chunks

    titles = "\n".join(f"{i}. {c['title']}" for i, c in enumerate(chunks))
    response = _llm().invoke([
        SystemMessage(content=_FILTER_PROMPT),
        HumanMessage(content=f"Section titles:\n{titles}"),
    ])

    indices: list[int] = json.loads(response.content)
    return [chunks[i] for i in indices if 0 <= i < len(chunks)]